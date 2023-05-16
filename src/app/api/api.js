export default async (req, res) => {
    try {
      const apiKey = process.env.AP_MEDIA_API_KEY;
      const apiUrl = 'https://api.example.com'; // Replace with the AP Media API URL
  
      // Make the request to the AP Media API
      const response = await fetch(`${apiUrl}/endpoint`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        // Add any other necessary request parameters
      });
  
      // Handle the API response and send the data back to the client
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      // Handle errors appropriately
      console.error(error);
      res.status(500).json({ error: 'An error occurred' });
    }
  };
  