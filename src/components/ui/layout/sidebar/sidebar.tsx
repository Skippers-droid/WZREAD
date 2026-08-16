import { Link, useLocation } from 'react-router-dom'
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import SearchIcon from '@mui/icons-material/Search'
import SettingsIcon from '@mui/icons-material/Settings'
import HistoryIcon from '@mui/icons-material/History'

const drawerWidth = 80
const mobileDrawerHeight = 60

export function Sidebar() {
  const theme = useTheme()
  const location = useLocation()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const isActive = (path: string) => {
    return location.pathname === path
  }

  if (isMobile) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          height: mobileDrawerHeight,
          bgcolor: 'rgba(13, 13, 13, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          px: 2,
        }}
      >
        <ListItemButton
          component={Link}
          to="/"
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            minWidth: 56,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              justifyContent: 'center',
              color: isActive('/') ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.5)',
              fontSize: '1.5rem',
            }}
          >
            <HomeIcon />
          </ListItemIcon>
          <Box
            component="span"
            sx={{
              fontSize: '0.6rem',
              color: isActive('/') ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.5)',
              mt: 0.25,
            }}
          >
            Home
          </Box>
        </ListItemButton>

        <ListItemButton
          component={Link}
          to="/history"
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            minWidth: 56,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              justifyContent: 'center',
              color: isActive('/history') ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.5)',
              fontSize: '1.5rem',
            }}
          >
            <HistoryIcon />
          </ListItemIcon>
          <Box
            component="span"
            sx={{
              fontSize: '0.6rem',
              color: isActive('/history') ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.5)',
              mt: 0.25,
            }}
          >
            History
          </Box>
        </ListItemButton>

        <ListItemButton
          component={Link}
          to="/browse"
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            minWidth: 56,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              justifyContent: 'center',
              color: isActive('/browse') ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.5)',
              fontSize: '1.5rem',
            }}
          >
            <SearchIcon />
          </ListItemIcon>
          <Box
            component="span"
            sx={{
              fontSize: '0.6rem',
              color: isActive('/browse') ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.5)',
              mt: 0.25,
            }}
          >
            Browse
          </Box>
        </ListItemButton>

        <ListItemButton
          component={Link}
          to="/settings"
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            minWidth: 56,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              justifyContent: 'center',
              color: isActive('/settings') ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.5)',
              fontSize: '1.5rem',
            }}
          >
            <SettingsIcon />
          </ListItemIcon>
          <Box
            component="span"
            sx={{
              fontSize: '0.6rem',
              color: isActive('/settings') ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.5)',
              mt: 0.25,
            }}
          >
            Settings
          </Box>
        </ListItemButton>
      </Box>
    )
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          bgcolor: 'transparent',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: 'none',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 0 }}>
        <List>
          <ListItem disablePadding sx={{ mb: 1 }}>
            <Tooltip title="Home" placement="right">
              <ListItemButton
                component={Link}
                to="/"
                sx={{
                  justifyContent: 'center',
                  px: 2,
                  py: 1.5,
                  borderRadius: 1,
                  mx: 1,
                  bgcolor: isActive('/') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive('/') ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                    color: isActive('/') ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  <HomeIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 1 }}>
            <Tooltip title="History" placement="right">
              <ListItemButton
                component={Link}
                to="/history"
                sx={{
                  justifyContent: 'center',
                  px: 2,
                  py: 1.5,
                  borderRadius: 1,
                  mx: 1,
                  bgcolor: isActive('/history') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive('/history') ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                    color: isActive('/history') ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  <HistoryIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 1 }}>
            <Tooltip title="Browse" placement="right">
              <ListItemButton
                component={Link}
                to="/browse"
                sx={{
                  justifyContent: 'center',
                  px: 2,
                  py: 1.5,
                  borderRadius: 1,
                  mx: 1,
                  bgcolor: isActive('/browse') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive('/browse') ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                    color: isActive('/browse') ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  <SearchIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>

          <ListItem disablePadding>
            <Tooltip title="Settings" placement="right">
              <ListItemButton
                component={Link}
                to="/settings"
                sx={{
                  justifyContent: 'center',
                  px: 2,
                  py: 1.5,
                  borderRadius: 1,
                  mx: 1,
                  bgcolor: isActive('/settings') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive('/settings') ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                    color: isActive('/settings') ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  <SettingsIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  )
}