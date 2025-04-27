import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Avatar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import SchoolIcon from '@mui/icons-material/School';
import axios from 'axios';

interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  expertise: string[];
  bio: string;
  imageUrl?: string;
}

interface MentorshipProgram {
  id: string;
  title: string;
  description: string;
  mentors: Mentor[];
  duration: string;
  requirements: string[];
  applicationLink: string;
}

const MentorshipPage: React.FC = () => {
  const [programs, setPrograms] = useState<MentorshipProgram[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:8000/mentorship', {
        params: { query: searchQuery },
      });
      setPrograms(response.data.programs);
    } catch (err) {
      setError('Failed to fetch mentorship programs. Please try again later.');
      console.error('Error fetching programs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    fetchPrograms();
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mentorship Programs
        </Typography>
        
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search mentorship programs..."
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : programs.length === 0 ? (
          <Typography align="center" color="text.secondary">
            No mentorship programs found. Try adjusting your search criteria.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {programs.map((program) => (
              <Grid item xs={12} key={program.id}>
                <Card
                  sx={{
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      transition: 'transform 0.2s',
                    },
                  }}
                >
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="h2">
                      {program.title}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {program.description}
                    </Typography>
                    
                    <Typography variant="h6" gutterBottom>
                      Program Duration: {program.duration}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Requirements:
                      </Typography>
                      {program.requirements.map((req, index) => (
                        <Chip
                          key={index}
                          label={req}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>

                    <Typography variant="h6" gutterBottom>
                      Featured Mentors:
                    </Typography>
                    <Grid container spacing={2}>
                      {program.mentors.map((mentor) => (
                        <Grid item xs={12} sm={6} md={4} key={mentor.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar
                              src={mentor.imageUrl}
                              sx={{ width: 56, height: 56, mr: 2 }}
                            >
                              {mentor.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1">
                                {mentor.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {mentor.title} at {mentor.company}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                {mentor.expertise.map((skill, index) => (
                                  <Chip
                                    key={index}
                                    label={skill}
                                    size="small"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="large"
                      color="primary"
                      href={program.applicationLink}
                      target="_blank"
                    >
                      Apply Now
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default MentorshipPage; 