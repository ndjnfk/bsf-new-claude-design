import { createTheme } from '@mui/material/styles'

// Dense theme suited to the data-heavy admin panel.
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1f6feb' },
    success: { main: '#1a7f37' },
    error: { main: '#cf222e' },
  },
  components: {
    MuiTableCell: { styleOverrides: { root: { padding: '6px 10px' } } },
  },
})
