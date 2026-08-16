import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  useTheme,
} from '@mui/material';

interface FilterParams {
  status: string;
  type: string;
  order: string;
  search: string;
}

interface FilterDialogProps {
  open: boolean;
  onClose: () => void;
  filterParams: FilterParams;
  onFilterChange: (key: keyof FilterParams, value: string) => void;
  onApply: () => void;
  onReset: () => void;
}

export function FilterDialog({
  open,
  onClose,
  filterParams,
  onFilterChange,
  onApply,
  onReset,
}: FilterDialogProps) {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          backdropFilter: 'blur(20px)',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }
      }}
    >
      <DialogTitle sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
        Filter Items
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Search"
            value={filterParams.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            sx={{
              '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
              '& .MuiOutlinedInput-root': {
                color: theme.palette.text.primary,
                '& fieldset': { borderColor: theme.palette.divider },
                '&:hover fieldset': { borderColor: theme.palette.text.secondary },
                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
              },
            }}
          />
          <FormControl fullWidth>
            <InputLabel sx={{ color: theme.palette.text.secondary }}>Status</InputLabel>
            <Select
              value={filterParams.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              sx={{
                color: theme.palette.text.primary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                '& .MuiSvgIcon-root': { color: theme.palette.text.secondary },
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="ongoing">Ongoing</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="hiatus">Hiatus</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel sx={{ color: theme.palette.text.secondary }}>Type</InputLabel>
            <Select
              value={filterParams.type}
              onChange={(e) => onFilterChange('type', e.target.value)}
              sx={{
                color: theme.palette.text.primary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                '& .MuiSvgIcon-root': { color: theme.palette.text.secondary },
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="manhwa">Manhwa</MenuItem>
              <MenuItem value="manhua">Manhua</MenuItem>
              <MenuItem value="manga">Manga</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel sx={{ color: theme.palette.text.secondary }}>Order</InputLabel>
            <Select
              value={filterParams.order}
              onChange={(e) => onFilterChange('order', e.target.value)}
              sx={{
                color: theme.palette.text.primary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                '& .MuiSvgIcon-root': { color: theme.palette.text.secondary },
              }}
            >
              <MenuItem value="">Default</MenuItem>
              <MenuItem value="asc">Oldest First</MenuItem>
              <MenuItem value="desc">Newest First</MenuItem>
              <MenuItem value="title">By Title</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onReset}
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': { color: theme.palette.text.primary },
            textTransform: 'none',
          }}
        >
          Reset
        </Button>
        <Button
          onClick={onClose}
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': { color: theme.palette.text.primary },
            textTransform: 'none',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onApply}
          variant="contained"
          color="primary"
          sx={{
            textTransform: 'none',
          }}
        >
          Apply Filter
        </Button>
      </DialogActions>
    </Dialog>
  );
}