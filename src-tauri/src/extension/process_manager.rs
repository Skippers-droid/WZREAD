// src-tauri/src/extension/process_manager.rs
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::process::{Child, Command};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use std::process::Stdio;

#[derive(Clone)]
pub struct ExtensionProcess {
    pub child: Arc<tokio::sync::Mutex<Child>>,
    pub extension_id: String,
    pub is_ready: bool,
}

impl ExtensionProcess {
    pub async fn new(extension_id: &str, exe_path: &PathBuf) -> Result<Self, String> {
        let full_exe_path = if cfg!(windows) {
            exe_path.join(format!("{}.exe", extension_id))
        } else {
            exe_path.join(extension_id)
        };

        if !full_exe_path.exists() {
            return Err(format!("Executable not found: {:?}", full_exe_path));
        }

        let child = Command::new(&full_exe_path)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn process: {}", e))?;

        Ok(Self {
            child: Arc::new(tokio::sync::Mutex::new(child)),
            extension_id: extension_id.to_string(),
            is_ready: true,
        })
    }

    pub async fn execute(&self, method: &str, args: &[String]) -> Result<String, String> {
        let mut child = self.child.lock().await;
        
        let stdin = child.stdin.take().ok_or("Failed to get stdin")?;
        let stdout = child.stdout.take().ok_or("Failed to get stdout")?;
        let stderr = child.stderr.take().ok_or("Failed to get stderr")?;
        
        let mut stdin_guard = stdin;
        let mut stdout_guard = stdout;
        let mut stderr_guard = stderr;

        let mut command = method.to_string();
        for arg in args {
            command.push(' ');
            command.push_str(arg);
        }
        command.push('\n');

        stdin_guard.write_all(command.as_bytes()).await
            .map_err(|e| format!("Failed to write to stdin: {}", e))?;
        stdin_guard.flush().await
            .map_err(|e| format!("Failed to flush stdin: {}", e))?;

        let mut reader = BufReader::new(&mut stdout_guard);
        let mut output = String::new();
        let mut line = String::new();
        
        while let Ok(bytes) = reader.read_line(&mut line).await {
            if bytes == 0 {
                break;
            }
            let trimmed = line.trim();
            if !trimmed.is_empty() {
                if trimmed.starts_with('{') || trimmed.starts_with('[') {
                    output.push_str(trimmed);
                    if let Ok(_) = serde_json::from_str::<serde_json::Value>(&output) {
                        break;
                    }
                } else {
                    eprintln!("[extension] {}", trimmed);
                }
            }
            line.clear();
        }

        let mut stderr_reader = BufReader::new(&mut stderr_guard);
        let mut stderr_line = String::new();
        while let Ok(bytes) = stderr_reader.read_line(&mut stderr_line).await {
            if bytes == 0 {
                break;
            }
            let trimmed = stderr_line.trim();
            if !trimmed.is_empty() {
                eprintln!("[extension] {}", trimmed);
            }
            stderr_line.clear();
        }

        child.stdin = Some(stdin_guard);
        child.stdout = Some(stdout_guard);
        child.stderr = Some(stderr_guard);

        if output.is_empty() {
            return Err("No JSON output received from extension".to_string());
        }

        Ok(output)
    }
}

#[derive(Clone)]
pub struct ProcessManager {
    processes: Arc<RwLock<HashMap<String, ExtensionProcess>>>,
    extension_paths: Arc<RwLock<HashMap<String, PathBuf>>>,
}

impl ProcessManager {
    pub fn new() -> Self {
        Self {
            processes: Arc::new(RwLock::new(HashMap::new())),
            extension_paths: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn register_extension(&self, extension_id: &str, exe_path: PathBuf) {
        let mut paths = self.extension_paths.write().await;
        paths.insert(extension_id.to_string(), exe_path);
    }

    pub async fn get_or_start_process(&self, extension_id: &str) -> Result<ExtensionProcess, String> {
        {
            let processes = self.processes.read().await;
            if let Some(process) = processes.get(extension_id) {
                let mut child = process.child.lock().await;
                match child.try_wait() {
                    Ok(Some(_)) => {
                        drop(child);
                        let mut processes = self.processes.write().await;
                        processes.remove(extension_id);
                    }
                    Ok(None) => {
                        if process.is_ready {
                            return Ok(process.clone());
                        }
                    }
                    Err(_) => {}
                }
            }
        }

        let paths = self.extension_paths.read().await;
        let exe_path = paths.get(extension_id)
            .ok_or_else(|| format!("Extension executable not found: {}", extension_id))?;

        let process = ExtensionProcess::new(extension_id, exe_path).await?;

        let mut processes = self.processes.write().await;
        processes.insert(extension_id.to_string(), process.clone());
        
        Ok(process)
    }

    pub async fn execute_extension(&self, extension_id: &str, method: &str, args: &[String]) -> Result<String, String> {
        let process = self.get_or_start_process(extension_id).await?;
        process.execute(method, args).await
    }
}