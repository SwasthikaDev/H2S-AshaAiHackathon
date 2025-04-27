const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const { initDB } = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require('pdf-parse');
const axios = require('axios');
const cheerio = require('cheerio');

dotenv.config();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to only allow PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const app = express();

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:9000', 'http://127.0.0.1:9000', 'http://127.0.0.1:5000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// Initialize database
initDB().catch(console.error);

// Store chat sessions in memory (in production, use a database)
const chatSessions = new Map();

// Chat endpoint for n8n chatbot integration
app.post('/chat', async (req, res) => {
    try {
        const { type, sessionId, text, route, context } = req.body;
        
        console.log('Chat request received:', {
            type,
            sessionId,
            text,
            route,
            context
        });

        // Initialize or retrieve session data
        if (!chatSessions.has(sessionId)) {
            chatSessions.set(sessionId, {
                history: [],
                userInfo: context || {}
            });
        }
        
        const session = chatSessions.get(sessionId);
        
        // Add user message to history
        session.history.push({
            role: 'user',
            content: text,
            timestamp: new Date().toISOString()
        });
        
        // Get user's name from context
        const userName = (context && context.name) ? context.name : 
                         (session.userInfo && session.userInfo.name) ? session.userInfo.name : 'there';
        
        // Process the message based on content
        let responseText = '';
        
        // Simple keyword-based responses (in production, use a proper NLP service or AI model)
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('resume') || lowerText.includes('cv')) {
            responseText = `Hi ${userName}, creating a strong resume is crucial for your job search. Here are some tips:\n\n` +
                "1. Tailor your resume to each job application\n" +
                "2. Use action verbs and quantify achievements\n" +
                "3. Keep it concise (1-2 pages)\n" +
                "4. Include relevant skills and keywords\n" +
                "5. Proofread carefully\n\n" +
                "Would you like me to review your resume? You can upload it using the button below.";
        } 
        else if (lowerText.includes('interview') || lowerText.includes('interviews')) {
            responseText = `${userName}, preparing for interviews is essential. Here are some interview tips:\n\n` +
                "1. Research the company thoroughly\n" +
                "2. Practice common interview questions\n" +
                "3. Prepare examples of your achievements\n" +
                "4. Dress professionally\n" +
                "5. Ask thoughtful questions\n\n" +
                "Would you like specific advice for technical interviews or behavioral interviews?";
        }
        else if (lowerText.includes('salary') || lowerText.includes('negotiate')) {
            responseText = `${userName}, salary negotiation is an important skill. Here are some tips:\n\n` +
                "1. Research industry salary ranges\n" +
                "2. Consider the total compensation package\n" +
                "3. Highlight your value and achievements\n" +
                "4. Practice your negotiation conversation\n" +
                "5. Be confident but flexible\n\n" +
                "Remember that negotiation is a normal part of the hiring process!";
        }
        else if (lowerText.includes('career change') || lowerText.includes('switch career')) {
            responseText = `${userName}, changing careers can be challenging but rewarding. Here's how to approach it:\n\n` +
                "1. Identify transferable skills\n" +
                "2. Research the new industry requirements\n" +
                "3. Consider additional education or certifications\n" +
                "4. Network with professionals in the target field\n" +
                "5. Update your resume to highlight relevant experience\n\n" +
                "What specific field are you interested in moving to?";
        }
        else if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hey')) {
            responseText = `Hello ${userName}! I'm Asha, your AI career assistant from JobsForHer Foundation. How can I help with your career journey today?`;
        }
        else {
            responseText = `Thank you for your message, ${userName}. I'm here to help with career advice, job search strategies, resume tips, interview preparation, and more. Could you please provide more details about what specific career assistance you're looking for?`;
        }
        
        // Add bot response to history
        session.history.push({
            role: 'assistant',
            content: responseText,
            timestamp: new Date().toISOString()
        });
        
        // Limit history size to prevent memory issues
        if (session.history.length > 50) {
            session.history = session.history.slice(-50);
        }
        
        // Send response
        res.json({
            response: responseText,
            sessionId
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// File upload endpoint with enhanced handling for resumes
app.post('/upload', async (req, res) => {
    try {
        const { type, file, sessionId, route, text } = req.body;
        
        console.log('File upload received:', {
            type,
            fileName: file?.originalname,
            sessionId,
            route,
            text
        });

        // Check if this is a resume upload
        const isResume = file?.originalname?.toLowerCase().includes('resume') || 
                        file?.originalname?.toLowerCase().includes('cv') ||
                        text?.toLowerCase().includes('resume') ||
                        text?.toLowerCase().includes('cv');

        let responseText = '';
        
        if (isResume) {
            responseText = "I've received your resume and will analyze it for you. Here's what I'll look for:\n\n" +
                "1. Clear structure and formatting\n" +
                "2. Impactful achievements and metrics\n" +
                "3. Relevant skills and keywords\n" +
                "4. Potential improvement areas\n\n" +
                "This might take a moment. I'll provide feedback shortly.";
        } else {
            responseText = "Thank you for uploading your file. I'll review it and get back to you soon.";
        }

        // If we have an active session, add this interaction to history
        if (chatSessions.has(sessionId)) {
            const session = chatSessions.get(sessionId);
            
            // Add file upload to history
            session.history.push({
                role: 'user',
                content: `[Uploaded file: ${file?.originalname || 'document'}]`,
                timestamp: new Date().toISOString()
            });
            
            // Add bot response to history
            session.history.push({
                role: 'assistant',
                content: responseText,
                timestamp: new Date().toISOString()
            });
        }

        res.json({
            response: responseText,
            sessionId,
            route
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// New endpoint to get chat history
app.get('/api/chat/history/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        if (!chatSessions.has(sessionId)) {
            return res.status(404).json({ error: 'Chat session not found' });
        }
        
        const session = chatSessions.get(sessionId);
        
        res.json({
            history: session.history,
            userInfo: session.userInfo
        });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Gemini integration endpoint

// Function to extract text from PDF
async function extractTextFromPDF(pdfPath) {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to extract text from PDF');
    }
}

// Function to extract skills from text (resume or message)
async function extractSkills(text) {
    try {
        // Common technical skills
        const technicalSkills = [
            'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go',
            'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET',
            'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap', 'Tailwind', 'Material UI',
            'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Oracle', 'SQLite', 'NoSQL', 'Firebase',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Git', 'GitHub',
            'REST API', 'GraphQL', 'Microservices', 'Serverless', 'WebSockets',
            'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision',
            'DevOps', 'SRE', 'Agile', 'Scrum', 'Kanban', 'JIRA', 'Confluence',
            'Testing', 'QA', 'Jest', 'Mocha', 'Selenium', 'Cypress', 'JUnit', 'TestNG'
        ];
        
        // Common soft skills
        const softSkills = [
            'Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Critical Thinking',
            'Time Management', 'Organization', 'Creativity', 'Adaptability', 'Flexibility',
            'Collaboration', 'Interpersonal', 'Presentation', 'Public Speaking', 'Negotiation',
            'Conflict Resolution', 'Decision Making', 'Analytical', 'Strategic Thinking',
            'Project Management', 'Customer Service', 'Client Relations', 'Mentoring', 'Coaching'
        ];
        
        // Common roles and job titles
        const roles = [
            'Software Engineer', 'Developer', 'Programmer', 'Web Developer', 'Frontend', 'Backend',
            'Full Stack', 'DevOps', 'SRE', 'Data Scientist', 'Data Analyst', 'Data Engineer',
            'Product Manager', 'Project Manager', 'Scrum Master', 'UX Designer', 'UI Designer',
            'QA Engineer', 'Test Engineer', 'Technical Writer', 'Technical Support',
            'Systems Administrator', 'Network Engineer', 'Database Administrator', 'DBA',
            'Security Engineer', 'Cybersecurity', 'Cloud Engineer', 'Solutions Architect',
            'Mobile Developer', 'iOS Developer', 'Android Developer',
            'Marketing', 'Sales', 'HR', 'Recruiter', 'Finance', 'Accounting',
            'Customer Success', 'Operations', 'Business Analyst', 'Content Writer',
            'Graphic Designer', 'Digital Marketing', 'SEO', 'Social Media'
        ];
        
        // Combine all keywords
        const allKeywords = [...technicalSkills, ...softSkills, ...roles];
        
        // Find matches in the text (case insensitive)
        const foundSkills = [];
        const textLower = text.toLowerCase();
        
        for (const skill of allKeywords) {
            const skillLower = skill.toLowerCase();
            if (textLower.includes(skillLower)) {
                foundSkills.push(skill);
            }
        }
        
        // Use Gemini to extract additional skills that might not be in our predefined lists
        const geminiApiKey = 'AIzaSyDJVw5l0CsIvi4Gt1Pq_EjVJggFKLQVdQ0';
        const ai = new GoogleGenerativeAI(geminiApiKey);
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `Extract professional skills from the following text. Include technical skills, soft skills, and areas of expertise. Format the output as a comma-separated list of skills only, without any explanations or additional text.\n\nText: ${text.substring(0, 3000)}`;
        
        const result = await model.generateContent(prompt);
        const geminiResponse = await result.response;
        const extractedSkills = geminiResponse.text().split(',').map(skill => skill.trim());
        
        // Combine predefined and AI-extracted skills, remove duplicates
        const allExtractedSkills = [...new Set([...foundSkills, ...extractedSkills])];
        
        return allExtractedSkills;
    } catch (error) {
        console.error('Error extracting skills:', error);
        return [];
    }
}

// Function to search for jobs based on skills
async function searchJobsAndOpportunities(skills, searchType = 'jobs') {
    try {
        // Create search queries based on skills
        const topSkills = skills.slice(0, 5); // Use top 5 skills for search
        const searchQuery = topSkills.join(' ');
        
        // Different search strings based on type
        let searchString = '';
        switch (searchType) {
            case 'jobs':
                searchString = `${searchQuery} jobs for women`;
                break;
            case 'events':
                searchString = `${searchQuery} career events workshops for women`;
                break;
            case 'mentoring':
                searchString = `${searchQuery} mentoring programs for women in tech`;
                break;
            default:
                searchString = `${searchQuery} jobs`;
        }
        
        // Encode the search string for URL
        const encodedSearch = encodeURIComponent(searchString);
        
        // Search Google for results
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=AIzaSyDJVw5l0CsIvi4Gt1Pq_EjVJggFKLQVdQ0&cx=017576662512468239146:omuauf_lfve&q=${encodedSearch}`;
        
        // Fallback to scraping search results if Google API fails
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        };
        
        // For jobs, try to get results from job portals directly
        let results = [];
        
        if (searchType === 'jobs') {
            // Try LinkedIn jobs search
            try {
                const linkedInUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodedSearch}&f_TPR=r86400`;
                const response = await axios.get(linkedInUrl, { headers });
                const $ = cheerio.load(response.data);
                
                $('.job-search-card').each((i, el) => {
                    if (i < 5) { // Limit to 5 results
                        const title = $(el).find('.job-search-card__title').text().trim();
                        const company = $(el).find('.job-search-card__company-name').text().trim();
                        const location = $(el).find('.job-search-card__location').text().trim();
                        const link = $(el).find('a').attr('href');
                        
                        results.push({
                            title,
                            company,
                            location,
                            link,
                            source: 'LinkedIn'
                        });
                    }
                });
            } catch (error) {
                console.error('Error scraping LinkedIn jobs:', error);
            }
            
            // Try Indeed jobs search
            try {
                const indeedUrl = `https://www.indeed.com/jobs?q=${encodedSearch}&sort=date`;
                const response = await axios.get(indeedUrl, { headers });
                const $ = cheerio.load(response.data);
                
                $('.job_seen_beacon').each((i, el) => {
                    if (i < 5) { // Limit to 5 results
                        const title = $(el).find('.jobTitle').text().trim();
                        const company = $(el).find('.companyName').text().trim();
                        const location = $(el).find('.companyLocation').text().trim();
                        const link = 'https://www.indeed.com' + $(el).find('a').attr('href');
                        
                        results.push({
                            title,
                            company,
                            location,
                            link,
                            source: 'Indeed'
                        });
                    }
                });
            } catch (error) {
                console.error('Error scraping Indeed jobs:', error);
            }
        } else if (searchType === 'events' || searchType === 'mentoring') {
            // For events and mentoring, use a general web search
            try {
                const googleUrl = `https://www.google.com/search?q=${encodedSearch}`;
                const response = await axios.get(googleUrl, { headers });
                const $ = cheerio.load(response.data);
                
                $('.g').each((i, el) => {
                    if (i < 5) { // Limit to 5 results
                        const title = $(el).find('h3').text().trim();
                        const description = $(el).find('.VwiC3b').text().trim();
                        const link = $(el).find('a').attr('href');
                        
                        if (title && link) {
                            results.push({
                                title,
                                description: description || 'No description available',
                                link: link.startsWith('/url?q=') ? link.substring(7, link.indexOf('&sa=')) : link,
                                source: 'Web Search'
                            });
                        }
                    }
                });
            } catch (error) {
                console.error(`Error scraping ${searchType}:`, error);
            }
        }
        
        // If we couldn't get results from direct scraping, use Gemini to generate suggestions
        if (results.length === 0) {
            const geminiApiKey = 'your_api_key';
            const ai = new GoogleGenerativeAI(geminiApiKey);
            const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            let promptType = '';
            switch (searchType) {
                case 'jobs':
                    promptType = 'job opportunities';
                    break;
                case 'events':
                    promptType = 'career events and workshops';
                    break;
                case 'mentoring':
                    promptType = 'mentoring programs';
                    break;
            }
            
            const prompt = `Based on these skills: ${skills.join(', ')}, suggest 5 relevant ${promptType} for women. For each suggestion, include: 1) Title, 2) Organization/Company, 3) Brief description, and 4) Where someone might find this opportunity (website or platform). Format as JSON array with fields: title, company, description, and where_to_find.`;
            
            const result = await model.generateContent(prompt);
            const geminiResponse = await result.response;
            const responseText = geminiResponse.text();
            
            // Try to parse JSON from the response
            try {
                // Extract JSON from the response if it's wrapped in markdown code blocks
                const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                                 responseText.match(/```\n([\s\S]*?)\n```/) ||
                                 [null, responseText];
                
                const jsonStr = jsonMatch[1].trim();
                const suggestions = JSON.parse(jsonStr);
                
                // Convert Gemini suggestions to our result format
                suggestions.forEach(item => {
                    results.push({
                        title: item.title,
                        company: item.company || item.organization || '',
                        description: item.description || '',
                        link: item.where_to_find || item.website || 'Search online for more information',
                        source: 'AI Suggestion'
                    });
                });
            } catch (jsonError) {
                console.error('Error parsing Gemini suggestions:', jsonError);
            }
        }
        
        return results;
    } catch (error) {
        console.error(`Error searching for ${searchType}:`, error);
        return [];
    }
}

// Function to extract content from a job listing URL
async function extractJobContentFromURL(url) {
    try {
        // Set headers to mimic a browser request
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
        };

        console.log(`Fetching job content from: ${url}`);
        const response = await axios.get(url, { headers });
        const html = response.data;
        
        // Use cheerio to parse HTML content
        const $ = cheerio.load(html);
        
        // Extract job details based on common job portal structures
        let jobTitle = '';
        let company = '';
        let location = '';
        let description = '';
        let requirements = '';
        
        // LinkedIn specific selectors
        if (url.includes('linkedin.com')) {
            jobTitle = $('.job-details-jobs-unified-top-card__job-title').text().trim() || 
                      $('.top-card-layout__title').text().trim();
            company = $('.job-details-jobs-unified-top-card__company-name').text().trim() || 
                     $('.topcard__org-name-link').text().trim();
            location = $('.job-details-jobs-unified-top-card__bullet').text().trim() || 
                      $('.topcard__flavor--bullet').text().trim();
            description = $('.description__text').text().trim() || 
                         $('.show-more-less-html__markup').text().trim();
        }
        // Indeed specific selectors
        else if (url.includes('indeed.com')) {
            jobTitle = $('.jobsearch-JobInfoHeader-title').text().trim();
            company = $('.jobsearch-InlineCompanyRating-companyName').text().trim();
            location = $('.jobsearch-JobInfoHeader-subtitle').find('div').eq(1).text().trim();
            description = $('#jobDescriptionText').text().trim();
        }
        // Naukri specific selectors
        else if (url.includes('naukri.com')) {
            jobTitle = $('.jd-header-title').text().trim();
            company = $('.jd-header-comp-name').text().trim();
            location = $('.location').text().trim();
            description = $('.job-desc').text().trim();
            requirements = $('.key-skill').text().trim();
        }
        // Generic extraction for other job portals
        else {
            // Extract all text from the page
            const pageText = $('body').text();
            
            // Try to find common job listing patterns
            jobTitle = $('h1').first().text().trim() || '';
            company = $('h2').first().text().trim() || '';
            
            // Get all paragraphs for description
            const paragraphs = $('p').map((i, el) => $(el).text().trim()).get().join('\n');
            description = paragraphs || pageText;
        }
        
        return {
            jobTitle,
            company,
            location,
            description,
            requirements,
            url,
            fullText: $('body').text().trim()
        };
    } catch (error) {
        console.error('Error extracting job content:', error);
        throw new Error('Failed to extract job content from URL');
    }
}

// Job link analysis endpoint
app.post('/api/analyze-job-link', async (req, res) => {
    try {
        const { url, sessionId } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        console.log('Job link analysis request received:', { url, sessionId });
        
        // Validate URL format
        const urlRegex = /^(https?:\/\/)?([\w\d]+\.)+[\w\d]{2,}(\/[\w\d\-._~:/?#[\]@!$&'()*+,;=]*)?$/;
        if (!urlRegex.test(url)) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }
        
        // Initialize session if needed
        if (!chatSessions.has(sessionId)) {
            chatSessions.set(sessionId, {
                history: [],
                userInfo: {}
            });
        }
        const session = chatSessions.get(sessionId);
        
        // Add URL to history
        session.history.push({
            role: 'user',
            content: `[Shared job link: ${url}]`,
            timestamp: new Date().toISOString()
        });
        
        // Extract job content from URL
        const jobContent = await extractJobContentFromURL(url);
        console.log('Job content extracted, analyzing...');
        
        // Prepare prompt for Gemini to analyze the job
        const systemPrompt = `You are a Career Growth Chatbot dedicated to supporting women at different stages of their professional journey.\n\nI need you to analyze this job listing and provide insights. Focus on:\n\n1. Job requirements and qualifications\n2. Key skills needed for this role\n3. Potential career growth opportunities\n4. Tips for applying to this position\n5. How this role might suit women at different career stages (fresher, riser, or restarter)\n\nBe specific, actionable, and supportive in your analysis.`;
        
        // Call Gemini API
        const geminiApiKey = 'AIzaSyDJVw5l0CsIvi4Gt1Pq_EjVJggFKLQVdQ0';
        const ai = new GoogleGenerativeAI(geminiApiKey);
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Create a prompt with instructions and the job content
        const combinedPrompt = `${systemPrompt}\n\nJOB DETAILS:\nTitle: ${jobContent.jobTitle}\nCompany: ${jobContent.company}\nLocation: ${jobContent.location}\n\nDescription:\n${jobContent.description}\n\nRequirements:\n${jobContent.requirements || 'Not explicitly listed'}\n\nURL: ${url}\n\nPlease analyze this job listing and provide insights:`;
        
        console.log('Sending job details to Gemini for analysis...');
        const result = await model.generateContent(combinedPrompt);
        const geminiResponse = await result.response;
        const responseText = geminiResponse.text() || "I'm sorry, I couldn't analyze the job listing properly.";
        
        // Add assistant response to history
        session.history.push({
            role: 'assistant',
            content: responseText,
            timestamp: new Date().toISOString()
        });
        
        return res.json({ 
            response: responseText, 
            sessionId,
            jobDetails: {
                title: jobContent.jobTitle,
                company: jobContent.company,
                location: jobContent.location
            }
        });
    } catch (error) {
        console.error('Job link analysis error:', error);
        return res.status(500).json({ error: 'Failed to analyze job link' });
    }
});

// Endpoint to search for jobs and opportunities based on skills
app.post('/api/search-opportunities', async (req, res) => {
    try {
        const { skills, sessionId, searchType = 'all' } = req.body;
        
        if (!skills || !Array.isArray(skills) || skills.length === 0) {
            return res.status(400).json({ error: 'Skills array is required' });
        }
        
        console.log(`Searching for ${searchType} opportunities with skills:`, skills);
        
        // Initialize session if needed
        if (!chatSessions.has(sessionId)) {
            chatSessions.set(sessionId, {
                history: [],
                userInfo: {}
            });
        }
        const session = chatSessions.get(sessionId);
        
        // Search for different types of opportunities
        let results = {};
        
        if (searchType === 'all' || searchType === 'jobs') {
            results.jobs = await searchJobsAndOpportunities(skills, 'jobs');
        }
        
        if (searchType === 'all' || searchType === 'events') {
            results.events = await searchJobsAndOpportunities(skills, 'events');
        }
        
        if (searchType === 'all' || searchType === 'mentoring') {
            results.mentoring = await searchJobsAndOpportunities(skills, 'mentoring');
        }
        
        // Generate a response message based on the results
        const geminiApiKey = 'AIzaSyDJVw5l0CsIvi4Gt1Pq_EjVJggFKLQVdQ0';
        const ai = new GoogleGenerativeAI(geminiApiKey);
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Create a summary of the results for Gemini to format nicely
        let resultsSummary = 'Based on your skills, I found these opportunities:';
        
        if (results.jobs && results.jobs.length > 0) {
            resultsSummary += '\n\nJOB OPPORTUNITIES:\n';
            results.jobs.forEach((job, index) => {
                resultsSummary += `${index + 1}. ${job.title} at ${job.company} (${job.location}) - ${job.source}\n`;
            });
        }
        
        if (results.events && results.events.length > 0) {
            resultsSummary += '\n\nEVENTS & WORKSHOPS:\n';
            results.events.forEach((event, index) => {
                resultsSummary += `${index + 1}. ${event.title} - ${event.source}\n`;
            });
        }
        
        if (results.mentoring && results.mentoring.length > 0) {
            resultsSummary += '\n\nMENTORING PROGRAMS:\n';
            results.mentoring.forEach((program, index) => {
                resultsSummary += `${index + 1}. ${program.title} - ${program.source}\n`;
            });
        }
        
        // Ask Gemini to format the results in a helpful, conversational way
        const prompt = `You are a Career Growth Chatbot dedicated to supporting women at different stages of their professional journey. Format the following search results into a helpful, encouraging response. Include links where available and provide brief advice on how to use these opportunities. Keep your response concise but informative.\n\n${resultsSummary}`;
        
        const result = await model.generateContent(prompt);
        const geminiResponse = await result.response;
        const responseText = geminiResponse.text();
        
        // Add assistant response to history
        session.history.push({
            role: 'assistant',
            content: responseText,
            timestamp: new Date().toISOString()
        });
        
        return res.json({
            response: responseText,
            sessionId,
            results
        });
    } catch (error) {
        console.error('Error searching for opportunities:', error);
        return res.status(500).json({ error: 'Failed to search for opportunities' });
    }
});

// Resume upload and analysis endpoint
app.post('/api/resume-upload', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded or file is not a PDF' });
        }

        console.log('Resume upload received:', {
            filename: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            sessionId: req.body.sessionId
        });

        // Extract text from the PDF
        const pdfText = await extractTextFromPDF(req.file.path);
        console.log('PDF text extracted, length:', pdfText.length);

        // Initialize session if needed
        const sessionId = req.body.sessionId;
        if (!chatSessions.has(sessionId)) {
            chatSessions.set(sessionId, {
                history: [],
                userInfo: {}
            });
        }
        const session = chatSessions.get(sessionId);

        // Add resume upload to history
        session.history.push({
            role: 'user',
            content: `[Uploaded resume: ${req.file.originalname}]`,
            timestamp: new Date().toISOString()
        });

        // Extract skills from the resume text
        console.log('Extracting skills from resume...');
        const extractedSkills = await extractSkills(pdfText);
        console.log('Skills extracted:', extractedSkills);
        
        // Store skills in session for later use
        session.userInfo.skills = extractedSkills;

        // Prepare prompt for Gemini to analyze the resume
        const systemPrompt = `You are a Career Growth Chatbot dedicated to supporting women at different stages of their professional journey.\n\nI need you to analyze this resume and provide constructive feedback. Focus on:\n\n1. Overall structure and formatting\n2. Skills assessment and keyword optimization\n3. Achievement highlights and metrics\n4. Areas for improvement\n5. Tailored job recommendations based on the resume content\n\nBe specific, actionable, and supportive in your feedback. Provide 2-3 concrete job positions this person might be qualified for based on their experience.`;

        // Call Gemini API
        const geminiApiKey = 'AIzaSyDJVw5l0CsIvi4Gt1Pq_EjVJggFKLQVdQ0';
        const ai = new GoogleGenerativeAI(geminiApiKey);
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Create a prompt with instructions and the resume text
        const combinedPrompt = `${systemPrompt}\n\nRESUME CONTENT:\n${pdfText}\n\nExtracted skills: ${extractedSkills.join(', ')}\n\nPlease analyze this resume and provide feedback:`;
        
        console.log('Sending resume to Gemini for analysis...');
        const result = await model.generateContent(combinedPrompt);
        const geminiResponse = await result.response;
        const resumeAnalysis = geminiResponse.text() || "I'm sorry, I couldn't analyze the resume properly.";
        
        // Now search for relevant opportunities based on extracted skills
        console.log('Searching for opportunities based on extracted skills...');
        let opportunitiesResponse = "";
        
        try {
            // Only search if we have enough skills (at least 3)
            if (extractedSkills.length >= 3) {
                // Search for all types of opportunities
                const jobResults = await searchJobsAndOpportunities(extractedSkills, 'jobs');
                const eventResults = await searchJobsAndOpportunities(extractedSkills, 'events');
                const mentoringResults = await searchJobsAndOpportunities(extractedSkills, 'mentoring');
                
                // Create a summary of the results for Gemini to format nicely
                let resultsSummary = 'Based on the skills in this resume, I found these opportunities:';
                
                if (jobResults && jobResults.length > 0) {
                    resultsSummary += '\n\nJOB OPPORTUNITIES:\n';
                    jobResults.forEach((job, index) => {
                        resultsSummary += `${index + 1}. ${job.title} at ${job.company || 'Company'} (${job.location || 'Location'}) - ${job.source}\n`;
                        if (job.link) resultsSummary += `   Link: ${job.link}\n`;
                    });
                }
                
                if (eventResults && eventResults.length > 0) {
                    resultsSummary += '\n\nEVENTS & WORKSHOPS:\n';
                    eventResults.forEach((event, index) => {
                        resultsSummary += `${index + 1}. ${event.title} - ${event.source}\n`;
                        if (event.description) resultsSummary += `   ${event.description.substring(0, 100)}...\n`;
                        if (event.link) resultsSummary += `   Link: ${event.link}\n`;
                    });
                }
                
                if (mentoringResults && mentoringResults.length > 0) {
                    resultsSummary += '\n\nMENTORING PROGRAMS:\n';
                    mentoringResults.forEach((program, index) => {
                        resultsSummary += `${index + 1}. ${program.title} - ${program.source}\n`;
                        if (program.description) resultsSummary += `   ${program.description.substring(0, 100)}...\n`;
                        if (program.link) resultsSummary += `   Link: ${program.link}\n`;
                    });
                }
                
                // Ask Gemini to format the opportunities in a helpful way
                const opportunitiesPrompt = `You are a Career Growth Chatbot dedicated to supporting women. Format the following search results into a helpful, encouraging response. Include links where available. Keep your response concise but informative.\n\n${resultsSummary}`;
                
                const opportunitiesResult = await model.generateContent(opportunitiesPrompt);
                const opportunitiesResponse = opportunitiesResult.response.text();
                
                // Combine resume analysis with opportunities
                const combinedResponse = `${resumeAnalysis}\n\n---\n\n**RELEVANT OPPORTUNITIES BASED ON YOUR RESUME**\n\n${opportunitiesResponse}`;
                
                // Add combined response to history
                session.history.push({
                    role: 'assistant',
                    content: combinedResponse,
                    timestamp: new Date().toISOString()
                });
                
                // Return the combined response
                return res.json({
                    response: combinedResponse,
                    sessionId,
                    filename: req.file.originalname,
                    skills: extractedSkills
                });
            } else {
                // Not enough skills extracted, just return the resume analysis
                session.history.push({
                    role: 'assistant',
                    content: resumeAnalysis,
                    timestamp: new Date().toISOString()
                });
                
                return res.json({
                    response: resumeAnalysis,
                    sessionId,
                    filename: req.file.originalname,
                    skills: extractedSkills
                });
            }
        } catch (opportunitiesError) {
            console.error('Error searching for opportunities:', opportunitiesError);
            
            // If opportunities search fails, still return the resume analysis
            session.history.push({
                role: 'assistant',
                content: resumeAnalysis,
                timestamp: new Date().toISOString()
            });
            
            // Clean up the uploaded file after processing
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
            
            return res.json({ 
                response: resumeAnalysis, 
                sessionId,
                filename: req.file.originalname,
                skills: extractedSkills
            });
        }
        
        // Clean up the uploaded file after processing
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
    } catch (error) {
        console.error('Resume analysis error:', error);
        return res.status(500).json({ error: 'Failed to analyze resume' });
    }
});

app.post('/api/gemini', async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        console.log('Gemini request received:', { message, sessionId });

        // Initialize or retrieve session data
        if (!chatSessions.has(sessionId)) {
            chatSessions.set(sessionId, {
                history: [],
                userInfo: {}
            });
        }
        const session = chatSessions.get(sessionId);
        
        // Add system prompt if this is a new session (first user message)
        if (session.history.length === 0) {
            session.history.push({
                role: 'system',
                content: `You are a Career Growth Chatbot dedicated to supporting women at different stages of their professional journey:\n\nRole:\nYou are a Career Growth Chatbot dedicated to supporting women at different stages of their professional journey:\n- Fresher (starting their career)\n- Riser (looking to advance)\n- Restarter (returning after a break)\n\nPrimary Objective:\nProvide empathetic, career-focused guidance and actively connect users to real opportunities, communities, sessions, events, and resources tailored to their goals from the internet, sharing links.\n\nCore Behavior Guidelines:\n- Tone: Be supportive, warm, and friendly — use light humor and puns where appropriate to build rapport.\n- Focus: Keep all conversations strictly career-related. Gently and firmly redirect if the user strays off-topic.\n- Career Mapping: Begin each interaction by identifying the user's career stage and skill set through thoughtful questioning.\n- Resource Finder: Proactively search online for relevant job opportunities, communities, and career resources, and share them based on the user's skills and goals.\n- Link Handling: If users share links, visit them and analyze the content to assist or guide them accordingly.\n- Resume Analysis: Accept user resumes, extract key skills and experiences, and offer actionable insights or improvements and get them job opening details, resources, mentors etc from the internet.\n- Session Management: Maintain context throughout the conversation to ensure a smooth and personalized user experience.\n- Audience Specificity: Your support is exclusively for women pursuing career growth in any field.\n- Trustworthiness: Only provide verified, factual information. Avoid assumptions or spreading unverified claims, if you don't know something, say so.\n- Engagement: Maintain a lively, encouraging dialogue to inspire users to take positive career steps.\n- Get job openings, sessions, other resources from career-focused, resource provider websites like linkedin, indeed, herkey, w3schools, geeksforgeeks etc.\n- Keep your answer crisp, not very lengthy, and not boring.\n- The chatbot should be able to go to links and understand them and also should be able to take in resume pdf files and understand the content of the files.`,
                timestamp: new Date().toISOString()
            });
        }
        
        // Add user message to history
        session.history.push({
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        });

        // Check if the message is asking about jobs or contains skills
        const jobRelatedTerms = ['job', 'career', 'work', 'position', 'opening', 'opportunity', 'hire', 'hiring', 'employment', 'skills', 'experience'];
        const isJobRelated = jobRelatedTerms.some(term => message.toLowerCase().includes(term));
        
        // Check if the message might contain skills
        const skillsIndicators = ['I know', 'I have experience', 'I am skilled', 'I can', 'my skills', 'I am good at', 'I work with', 'I use', 'experienced in', 'proficient in', 'expertise in'];
        const mightContainSkills = skillsIndicators.some(indicator => message.toLowerCase().includes(indicator.toLowerCase()));
        
        // If the message is job-related and might contain skills, extract them
        let extractedSkills = [];
        let shouldSearchOpportunities = false;
        
        if (isJobRelated && mightContainSkills && message.length > 30) {
            console.log('Message might contain skills, extracting...');
            extractedSkills = await extractSkills(message);
            console.log('Skills extracted from message:', extractedSkills);
            
            // Store or update skills in session
            if (extractedSkills.length > 0) {
                if (!session.userInfo.skills) {
                    session.userInfo.skills = extractedSkills;
                } else {
                    // Merge with existing skills, remove duplicates
                    session.userInfo.skills = [...new Set([...session.userInfo.skills, ...extractedSkills])];
                }
                shouldSearchOpportunities = extractedSkills.length >= 3;
            }
        } else if (isJobRelated && session.userInfo.skills && session.userInfo.skills.length >= 3) {
            // If the message is job-related and we already have skills stored, use those
            extractedSkills = session.userInfo.skills;
            shouldSearchOpportunities = true;
            console.log('Using previously stored skills:', extractedSkills);
        }

        // Gemini API call using official SDK
        const systemPrompt = `You are a Career Growth Chatbot dedicated to supporting women at different stages of their professional journey:\n\nRole:\nYou are a Career Growth Chatbot dedicated to supporting women at different stages of their professional journey:\n- Fresher (starting their career)\n- Riser (looking to advance)\n- Restarter (returning after a break)\n\nPrimary Objective:\nProvide empathetic, career-focused guidance and actively connect users to real opportunities, communities, sessions, events, and resources tailored to their goals from the internet, sharing links.\n\nCore Behavior Guidelines:\n- Tone: Be supportive, warm, and friendly — use light humor and puns where appropriate to build rapport.\n- Focus: Keep all conversations strictly career-related. Gently and firmly redirect if the user strays off-topic.\n- Career Mapping: Begin each interaction by identifying the user's career stage and skill set through thoughtful questioning.\n- Resource Finder: Proactively search online for relevant job opportunities, communities, and career resources, and share them based on the user's skills and goals.\n- Link Handling: If users share links, visit them and analyze the content to assist or guide them accordingly.\n- Resume Analysis: Accept user resumes, extract key skills and experiences, and offer actionable insights or improvements and get them job opening details, resources, mentors etc from the internet.\n- Session Management: Maintain context throughout the conversation to ensure a smooth and personalized user experience.\n- Audience Specificity: Your support is exclusively for women pursuing career growth in any field.\n- Trustworthiness: Only provide verified, factual information. Avoid assumptions or spreading unverified claims, if you don't know something, say so.\n- Engagement: Maintain a lively, encouraging dialogue to inspire users to take positive career steps.\n- Get job openings, sessions, other resources from career-focused, resource provider websites like linkedin, indeed, herkey, w3schools, geeksforgeeks etc.\n- Keep your answer crisp, not very lengthy, and not boring.\n- The chatbot should be able to go to links and understand them and also should be able to take in resume pdf files and understand the content of the files.`;
        const geminiApiKey = 'AIzaSyDJVw5l0CsIvi4Gt1Pq_EjVJggFKLQVdQ0';
        const ai = new GoogleGenerativeAI(geminiApiKey);
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        let responseText = "I'm sorry, I couldn't get a response from Gemini.";
        
        try {
            // For Gemini, we need to include the system prompt as part of the user message
            // since 'system' role is not supported
            
            // Create a prompt with instructions followed by the user's message
            const combinedPrompt = `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`;            
            
            // Log what's being sent to Gemini
            console.log('Sending to Gemini API:', {
                model: "gemini-1.5-flash",
                promptPreview: combinedPrompt.substring(0, 100) + '... (truncated)',
                userMessage: message
            });
            
            // Send as a single text prompt - this is the format Gemini expects
            const result = await model.generateContent(combinedPrompt);
            const geminiResponse = await result.response;
            responseText = geminiResponse.text() || responseText;
            
            // Log successful response
            console.log('Gemini API response received successfully');
        } catch (geminiError) {
            console.error('Gemini API error:', geminiError);
        }
        
        // If we should search for opportunities, do that and append to the response
        if (shouldSearchOpportunities) {
            try {
                console.log('Searching for opportunities based on skills...');
                
                // Search for jobs only (to keep response focused)
                const jobResults = await searchJobsAndOpportunities(extractedSkills, 'jobs');
                
                if (jobResults && jobResults.length > 0) {
                    // Create a summary of the results
                    let resultsSummary = '\n\nBased on your skills, I found these job opportunities that might interest you:';
                    
                    jobResults.forEach((job, index) => {
                        resultsSummary += `\n\n${index + 1}. **${job.title}** at ${job.company || 'Company'}`;
                        if (job.location) resultsSummary += ` (${job.location})`;
                        if (job.link) resultsSummary += `\n   Link: ${job.link}`;
                    });
                    
                    resultsSummary += '\n\nWould you like me to find more specific opportunities or perhaps events and mentoring programs related to your skills?';
                    
                    // Append the job results to the response
                    responseText += resultsSummary;
                }
            } catch (opportunitiesError) {
                console.error('Error searching for opportunities:', opportunitiesError);
                // Continue with the regular response if opportunity search fails
            }
        }

        // Add assistant response to history
        session.history.push({
            role: 'assistant',
            content: responseText,
            timestamp: new Date().toISOString()
        });
        
        // Limit history size to prevent memory issues
        if (session.history.length > 50) {
            session.history = session.history.slice(-50);
        }
        
        return res.json({ 
            response: responseText, 
            sessionId,
            skills: extractedSkills.length > 0 ? extractedSkills : undefined
        });
    } catch (error) {
        console.error('Gemini endpoint error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = 9002; // Changed to port 9002 to avoid conflicts
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
