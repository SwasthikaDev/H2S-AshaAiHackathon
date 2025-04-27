import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ChatIcon from '@mui/icons-material/Chat';
import WorkIcon from '@mui/icons-material/Work';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';

const Navbar: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChatIcon sx={{ mr: 1 }} />
          Asha AI
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            component={RouterLink}
            to="/chat"
            startIcon={<ChatIcon />}
          >
            Chat
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/jobs"
            startIcon={<WorkIcon />}
          >
            Jobs
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/events"
            startIcon={<EventIcon />}
          >
            Events
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/mentorship"
            startIcon={<PeopleIcon />}
          >
            Mentorship
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 