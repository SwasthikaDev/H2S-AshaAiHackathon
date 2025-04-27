import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ChatIcon from '@mui/icons-material/Chat';
import WorkIcon from '@mui/icons-material/Work';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Chat with Asha',
      description: 'Get personalized guidance and support for your career journey',
      icon: <ChatIcon fontSize="large" />,
      path: '/chat',
    },
    {
      title: 'Job Opportunities',
      description: 'Explore curated job listings for women professionals',
      icon: <WorkIcon fontSize="large" />,
      path: '/jobs',
    },
    {
      title: 'Community Events',
      description: 'Discover networking events and workshops',
      icon: <EventIcon fontSize="large" />,
      path: '/events',
    },
    {
      title: 'Mentorship Programs',
      description: 'Connect with experienced mentors in your field',
      icon: <PeopleIcon fontSize="large" />,
      path: '/mentorship',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          pt: 8,
          pb: 6,
          textAlign: 'center',
        }}
      >
        <Typography
          component="h1"
          variant="h2"
          color="primary"
          gutterBottom
        >
          Welcome to Asha AI
        </Typography>
        <Typography
          variant="h5"
          color="text.secondary"
          paragraph
        >
          Your personal AI assistant for career growth and professional development
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<ChatIcon />}
          onClick={() => navigate('/chat')}
          sx={{ mt: 4 }}
        >
          Start Chatting
        </Button>
      </Box>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        {features.map((feature) => (
          <Grid item xs={12} sm={6} md={3} key={feature.title}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  transition: 'transform 0.2s',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography gutterBottom variant="h5" component="h2">
                  {feature.title}
                </Typography>
                <Typography color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => navigate(feature.path)}
                  fullWidth
                >
                  Learn More
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default HomePage; 