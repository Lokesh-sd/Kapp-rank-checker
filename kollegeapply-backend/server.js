import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const app = express();

// Improved domain regex
const domainRegex = /^https?:\/\/(?:www\.)?kollegeapply\.com(?:\/.*)?$/;
const API_URL = 'https://serpapi.com/search';

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://kapp-rank-checker.vercel.app']
    : ['http://localhost:5173']
};

app.use(cors(corsOptions));
app.use(express.json());

// Delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchSERPResults = async (keyword, start = 0) => {
  try {
    const response = await axios.get(API_URL, {
      params: {
        q: keyword,
        api_key: process.env.SERP_API_KEY,
        num: 100,
        start: start,
        engine: 'google',
        location: 'India',
        google_domain: 'google.co.in'
      },
    });
    // Check the response status code
    if (response.status !== 200) {
      throw new Error(`SerpAPI error: ${response.status} - ${response.statusText}`);
    }
    return response.data.organic_results || [];
  } catch (error) {
    console.error('Error fetching SERP results:', error.message);
    throw error; // Re-throw the error to be caught in findRank
  }
};

const findRank = async (keyword) => {
  let start = 0;
  let rank = null;
  let retries = 3; // Number of retries

  while (start < 1000 && retries > 0) {
    try {
      const results = await fetchSERPResults(keyword, start);

      if (!results || results.length === 0) break;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.link && domainRegex.test(result.link)) {
          rank = start + i + 1;
          return rank;
        }
      }
      start += 100;
      await delay(200); // Add a delay of 200ms between requests to avoid rate limits
    } catch (error) {
      console.error('Error in findRank:', error.message);
      retries--;
      if (retries <= 0) {
        throw new Error("Failed to get rank after multiple retries");
      }
      await delay(1000); // Wait 1 second before retrying
    }
  }
  return rank;
};

app.post('/api/check-ranking', async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword?.trim()) {
      return res.status(400).json({ error: 'Please enter a valid keyword' });
    }
    const rank = await findRank(keyword);
    res.json({
      keyword: keyword,
      rank: rank !== null ? rank : 'Not Found',
    });
  } catch (error) {
    console.error('Search failed:', error.message);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
