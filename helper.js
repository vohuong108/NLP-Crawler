const axios = require('axios');

const queryVideoId = async(base_url, part, query, relevanceLanguage, regionCode, maxResults, type, pageToken, API_KEY) => {
    let url = "";
    if(pageToken) {
        url = base_url 
            + "?part=" + part 
            + "&pageToken=" + pageToken 
            + "&q=" + query 
            + "&regionCode=" + regionCode
            + "&maxResults=" + maxResults
            + "&relevanceLanguage=" + relevanceLanguage
            + "&type=" + type 
            + "&key=" + API_KEY;

    } else {
        url = base_url 
            + "?part=" + part
            + "&q=" + query
            + "&regionCode=" + regionCode
            + "&maxResults=" + maxResults
            + "&relevanceLanguage=" + relevanceLanguage
            + "&type=" + type 
            + "&key=" + API_KEY;
    }

    for(let i = 0; i < 3; i += 1) {
        try {
            let res = await axios({
                method: "GET",
                url: url
            });
            
            console.log("SEND QUERY SEARCH SUCCESS");
            return res;
        } catch (err) {
            console.error("ERROR IN CRAWL VIDEO ID");
            console.log("=>>>>> Replay ", i, "times");
            
            if(i === 2) return "FAILED QUERY VIDEO ID";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
        
    }
};

const queryComment = async (base_url, part, maxResults, order, textFormat, videoID, key, pageToken) => {
    let url = `${base_url}?part=${part.join("%2C")}&maxResults=${maxResults}&order=${order}&textFormat=${textFormat}&videoId=${videoID}${pageToken ? '&pageToken=' + pageToken : ''}&key=${key}`;
    
    for(let i=0; i<3; i += 1) {
        try {
            let res = await axios.get(url);
            console.log("SEND QUERY COMMENT SUCCESS");
            return res?.data;
    
        } catch (err) {
            console.error("!!!!!!!!!ERROR IN SENT QUERY: ", err.message);
            console.log("!!!!!!!!!ERROR CODE: ", err.response.status, " ERROR STATUS: ", err.response.statusText);

            if(err.response.status === 403 && err.response.statusText === "quotaExceeded") return "FAILED QUERY";
            else if(err.response.status === 403 && err.response.statusText === "Forbidden") return "QUERY 403";
            console.log("=>>>>> Replay ", i, "times");
            if(i === 2) return "FAILED QUERY";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

module.exports = {queryVideoId, queryComment};

