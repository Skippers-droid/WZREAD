use anyhow::Result;
use reqwest::Client;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::process::Child;
use tokio::io::AsyncBufReadExt;
use tokio::io::BufReader;

#[derive(Clone)]
pub struct RpcClient {
    client: Client,
    url: String,
}

impl RpcClient {
    pub fn new(port: u16) -> Self {
        Self {
            client: Client::new(),
            url: format!("http://127.0.0.1:{}", port),
        }
    }

    pub async fn call(&self, method: &str, params: Value) -> Result<Value> {
        let response = self.client
            .post(&self.url)
            .json(&json!({
                "jsonrpc": "2.0",
                "method": method,
                "params": params,
                "id": 1
            }))
            .send()
            .await?;

        let result: Value = response.json().await?;
        
        if let Some(error) = result.get("error") {
            return Err(anyhow::anyhow!("RPC error: {}", error));
        }

        Ok(result["result"].clone())
    }
}

#[derive(Clone)]
pub struct ExtensionRpcManager {
    processes: Arc<Mutex<HashMap<String, (Child, RpcClient)>>>,
}

impl ExtensionRpcManager {
    pub fn new() -> Self {
        Self {
            processes: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn start_extension(&self, extension_id: &str, exe_path: &str) -> Result<RpcClient> {
        let mut processes = self.processes.lock().await;
        
        if let Some((_, client)) = processes.get(extension_id) {
            return Ok(client.clone());
        }

        let mut child = tokio::process::Command::new(exe_path)
            .arg("--rpc")
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()?;

        let stdout = child.stdout.take().unwrap();
        let mut reader = BufReader::new(stdout);
        let mut line = String::new();
        reader.read_line(&mut line).await?;
        
        let port = line.trim()
            .strip_prefix("RPC_PORT=")
            .ok_or_else(|| anyhow::anyhow!("Failed to get RPC port"))?
            .parse::<u16>()?;

        let client = RpcClient::new(port);
        processes.insert(extension_id.to_string(), (child, client.clone()));
        
        Ok(client)
    }

    pub async fn execute(&self, extension_id: &str, method: &str, params: Value) -> Result<Value> {
        let processes = self.processes.lock().await;
        let (_, client) = processes.get(extension_id)
            .ok_or_else(|| anyhow::anyhow!("Extension not running: {}", extension_id))?;
        
        client.call(method, params).await
    }

    pub async fn stop_extension(&self, extension_id: &str) -> Result<()> {
        let mut processes = self.processes.lock().await;
        if let Some((mut child, _)) = processes.remove(extension_id) {
            let _ = child.kill().await;
        }
        Ok(())
    }

    pub async fn stop_all(&self) -> Result<()> {
        let mut processes = self.processes.lock().await;
        for (_, (mut child, _)) in processes.drain() {
            let _ = child.kill().await;
        }
        Ok(())
    }
}