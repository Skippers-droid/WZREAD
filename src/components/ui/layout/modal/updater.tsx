import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
  Box,
  useTheme,
  Chip,
  IconButton,
} from '@mui/material';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';

interface UpdateModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpdateModal({ open, onClose }: UpdateModalProps) {
  const theme = useTheme();
  const [checking, setChecking] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (open) {
      checkForUpdates();
    }
  }, [open]);

  const checkForUpdates = async () => {
    try {
      setChecking(true);
      setError(null);
      
      const update = await check();
      
      if (update) {
        setUpdateAvailable(true);
        setUpdateInfo(update);
      } else {
        setUpdateAvailable(false);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError('Failed to check for updates');
      console.error('Update check failed:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleDownload = async () => {
    if (!updateInfo) return;

    try {
      setDownloading(true);
      setError(null);
      setDownloadProgress(0);

      await updateInfo.downloadAndInstall((event: any) => {
        if (event.event === 'DownloadProgress') {
          const progress = (event.data.chunkLength / event.data.contentLength) * 100;
          setDownloadProgress(Math.min(progress, 100));
        }
      });

      setDownloading(false);
      setInstalling(true);
      setInstalled(true);
      
      setTimeout(async () => {
        await relaunch();
      }, 1500);
    } catch (err) {
      setError('Failed to download update');
      console.error('Download failed:', err);
      setDownloading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const getStatusText = () => {
    if (checking) return 'Checking for updates...';
    if (error) return 'Error checking for updates';
    if (installed) return 'Update installed! Restarting...';
    if (installing) return 'Installing update...';
    if (downloading) return `Downloading update... ${Math.round(downloadProgress)}%`;
    if (updateAvailable) return `Version ${updateInfo?.version} is available`;
    return 'You are running the latest version';
  };

  const getStatusIcon = () => {
    if (error) return <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 56 }} />;
    if (installed || (!updateAvailable && !checking)) return <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 56 }} />;
    if (updateAvailable) return <CloudDownloadIcon sx={{ color: theme.palette.primary.main, fontSize: 56 }} />;
    return null;
  };

  return (
    <Dialog
      open={open}
      onClose={handleSkip}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          p: 3,
          position: 'relative',
        },
      }}
    >
      <IconButton
        onClick={handleSkip}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: theme.palette.text.secondary,
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogTitle sx={{ color: theme.palette.text.primary, fontWeight: 'bold', textAlign: 'center', pt: 0 }}>
        {updateAvailable ? 'Update Available' : 'Software Update'}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
          {getStatusIcon()}

          <Typography variant="h6" sx={{ color: theme.palette.text.primary, textAlign: 'center' }}>
            {getStatusText()}
          </Typography>

          {checking && (
            <Box sx={{ width: '100%', mt: 1 }}>
              <LinearProgress
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: theme.palette.action.hover,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                    bgcolor: theme.palette.primary.main,
                  },
                }}
              />
            </Box>
          )}

          {updateAvailable && updateInfo && (
            <Box sx={{ width: '100%', mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Current: v{updateInfo.currentVersion}
                </Typography>
                <Chip
                  label={`v${updateInfo.version}`}
                  size="small"
                  sx={{
                    bgcolor: `${theme.palette.primary.main}33`,
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                  }}
                />
              </Box>
              {updateInfo.description && (
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1, whiteSpace: 'pre-wrap' }}>
                  {updateInfo.description}
                </Typography>
              )}
              {updateInfo.date && (
                <Typography variant="caption" sx={{ color: theme.palette.text.disabled, mt: 1, display: 'block' }}>
                  Released: {new Date(updateInfo.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
              )}
            </Box>
          )}

          {(downloading || installing) && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress
                variant={downloading ? 'determinate' : 'indeterminate'}
                value={downloadProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: theme.palette.action.hover,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    bgcolor: theme.palette.primary.main,
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: theme.palette.text.disabled, mt: 1, display: 'block', textAlign: 'center' }}>
                {downloading ? `Downloading... ${Math.round(downloadProgress)}%` : 'Installing...'}
              </Typography>
            </Box>
          )}

          {error && (
            <Typography variant="body2" sx={{ color: theme.palette.error.main, textAlign: 'center' }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', gap: 2, pt: 2 }}>
        {!checking && !downloading && !installing && !installed && (
          <>
            {updateAvailable ? (
              <>
                <Button
                  variant="contained"
                  onClick={handleDownload}
                  sx={{
                    textTransform: 'none',
                    px: 4,
                    py: 1,
                  }}
                >
                  Update Now
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleSkip}
                  sx={{
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                  }}
                >
                  Skip
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={onClose}
                sx={{
                  textTransform: 'none',
                  px: 4,
                  py: 1,
                }}
              >
                Close
              </Button>
            )}
          </>
        )}

        {(downloading || installing) && (
          <Button
            variant="text"
            disabled
            sx={{
              textTransform: 'none',
            }}
          >
            {installed ? 'Restarting...' : 'Please wait...'}
          </Button>
        )}

        {error && (
          <Button
            variant="contained"
            onClick={checkForUpdates}
            sx={{
              textTransform: 'none',
              px: 4,
              py: 1,
            }}
          >
            Retry
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}