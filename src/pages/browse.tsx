import { useState } from 'react';
import {
  Box,
  CssBaseline,
  Paper,
  Container,
  Typography,
  IconButton,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SourceIcon from '@mui/icons-material/Source';
import ExtensionIcon from '@mui/icons-material/Extension';
import { SearchModal, ExtensionsTab, SourcesTab } from '~/components';

export function Browse() {
  const theme = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: theme.palette.background.default }}>
      <CssBaseline />
      
      <Box component="main" sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Container maxWidth={false} sx={{ height: '100%', overflow: 'hidden', p: 0 }}>
          <Paper 
            elevation={0}
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              bgcolor: 'transparent',
              borderRadius: 0,
            }}
          >
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 3,
              pt: 3,
              pb: 1,
            }}>
              <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                Browse
              </Typography>
              <IconButton onClick={() => setSearchOpen(true)}>
                <SearchIcon />
              </IconButton>
            </Box>
            
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'center',
              px: 0,
              borderBottom: 1,
              borderColor: theme.palette.divider,
            }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                centered
                sx={{
                  '& .MuiTab-root': {
                    color: theme.palette.text.secondary,
                    '&.Mui-selected': {
                      color: theme.palette.text.primary,
                    },
                    minWidth: 120,
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: theme.palette.primary.main,
                  },
                }}
              >
                <Tab icon={<SourceIcon />} label="Sources" />
                <Tab icon={<ExtensionIcon />} label="Extensions" />
              </Tabs>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              {tabValue === 0 && <SourcesTab />}
              {tabValue === 1 && <ExtensionsTab />}
            </Box>
          </Paper>
        </Container>
      </Box>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </Box>
  );
}