// // FortniteAPI service for fetching player data
// // Using FortniteAPI.io - requires an API key

// // IMPORTANT: For production use, store this API key in environment variables
// // Create a .env file with REACT_APP_FORTNITE_API_KEY=your_api_key
// // Then use process.env.REACT_APP_FORTNITE_API_KEY instead of hardcoding it
// // This API key is provided for development purposes only
// const API_KEY = "1f01f520-ffe5a2aa-d5ed9418-ed573607"; 

// // Base URL for the API
// const BASE_URL = "https://fortniteapi.io";

// /**
//  * Search for a player by their Epic Games username
//  * @param {string} username - The Epic Games username to search for
//  * @returns {Promise} - Promise with the account ID if found
//  */
// export const searchPlayerByUsername = async (username) => {
//   try {
//     if (!username || username.trim() === '') {
//       throw new Error("Username cannot be empty");
//     }

//     console.log(`Searching for player: ${username}`);
    
//     const response = await fetch(`${BASE_URL}/v1/lookup?username=${encodeURIComponent(username)}`, {
//       method: 'GET',
//       headers: {
//         'Authorization': API_KEY
//       }
//     });

//     const data = await response.json();
//     console.log("API Response:", data);
    
//     if (!response.ok) {
//       if (response.status === 404) {
//         throw new Error(`Player "${username}" not found`);
//       } else if (response.status === 401) {
//         throw new Error("Invalid API key. Please check your FortniteAPI.io key");
//       } else {
//         throw new Error(`Error ${response.status}: ${data.error || response.statusText}`);
//       }
//     }
    
//     if (!data.result) {
//       throw new Error(`Player "${username}" not found in Fortnite database`);
//     }
    
//     if (!data.account || !data.account.id) {
//       throw new Error(`Found player "${username}" but their account ID is missing`);
//     }
    
//     return data.account;
//   } catch (error) {
//     console.error("Error searching for player:", error);
//     throw error;
//   }
// };

// /**
//  * Get player stats by account ID
//  * @param {string} accountId - The Epic Games account ID
//  * @returns {Promise} - Promise with the player stats
//  */
// export const getPlayerStats = async (accountId) => {
//   try {
//     const response = await fetch(`${BASE_URL}/v1/stats?account=${accountId}`, {
//       method: 'GET',
//       headers: {
//         'Authorization': API_KEY
//       }
//     });

//     if (!response.ok) {
//       throw new Error(`Error ${response.status}: ${response.statusText}`);
//     }

//     const data = await response.json();
    
//     if (!data.result) {
//       throw new Error("Stats not found for this player");
//     }
    
//     return data;
//   } catch (error) {
//     console.error("Error fetching player stats:", error);
//     throw error;
//   }
// };

// /**
//  * Get player stats directly by username (combines the two functions above)
//  * @param {string} username - The Epic Games username
//  * @returns {Promise} - Promise with the player stats
//  */
// export const getPlayerStatsByUsername = async (username) => {
//   try {
//     const account = await searchPlayerByUsername(username);
//     if (!account || !account.id) {
//       throw new Error("Could not find account ID for username");
//     }
    
//     return await getPlayerStats(account.id);
//   } catch (error) {
//     console.error("Error getting player stats by username:", error);
//     throw error;
//   }
// }; 