import axios from "axios";

export async function searchLocations(query) {

  const response = await axios.get(

    `${import.meta.env.VITE_API_URL}/api/search-locations/`,

    {
      params: {
        q: query
      }
    }

  );

  return response.data;
}