import axios from "axios";

export async function searchLocations(query) {

  const response = await axios.get(

    "http://127.0.0.1:8000/api/search-location/",

    {
      params: {
        q: query
      }
    }

  );

  return response.data;
}