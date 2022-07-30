const axios = require('axios');

const queryVideoId = async(base_url, part, query, relevanceLanguage, regionCode, maxResults, type, pageToken, API_KEY) => {
    let url = "";
    if(pageToken) {
        url = base_url 
            + "?part=" + part 
            + "&pageToken=" + pageToken
            + "&order=date"
            + "&publishedAfter=2021-09-30T06%3A29%3A59Z"
            + "&publishedBefore=2022-07-27T23%3A59%3A59Z"
            + "&q=" + query 
            + "&regionCode=" + regionCode
            + "&maxResults=" + maxResults
            + "&relevanceLanguage=" + relevanceLanguage
            + "&type=" + type 
            + "&key=" + API_KEY;

    } else {
        url = base_url 
            + "?part=" + part
            + "&order=date"
            + "&publishedAfter=2021-09-30T06%3A29%3A59Z"
            + "&publishedBefore=2022-07-27T23%3A59%3A59Z"
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
            console.error("################################ERROR IN SENT QUERY: ", err?.message);
            console.log("ERROR CODE: ", err?.response?.status, " ERROR STATUS: ", err?.response?.statusText);
            console.error("LIST ERROR: ", err?.response?.data?.error?.errors);

            if(err?.response?.data?.error?.errors[0]?.reason ===  'quotaExceeded') return "QUERY QUOTA EXCEED";

            console.log("=>>>>> Replay ", i, "times");
            if(i === 2) return "FAILED QUERY VIDEO ID";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
        
    }
};

const queryCommentThreads = async (
    base_url, part, maxResults, order, 
    textFormat, videoId, API_KEY, pageToken
    ) => {
        let url = "";
        if(pageToken) {
            url = base_url 
                + "?part=" + part.join("%2C")
                + "&pageToken=" + pageToken
                + "&order=" + order
                + "&maxResults=" + maxResults
                + "&textFormat=" + textFormat
                + "&videoId=" + videoId
                + "&pageToken=" + pageToken
                + "&key=" + API_KEY;

        } else {
            url = base_url 
                + "?part=" + part.join("%2C")
                + "&order=" + order
                + "&maxResults=" + maxResults
                + "&textFormat=" + textFormat
                + "&videoId=" + videoId
                + "&key=" + API_KEY;
        }
    
    for(let i=0; i<3; i += 1) {
        try {
            let res = await axios.get(url);
            console.log("SEND QUERY COMMENT THREADS SUCCESS");
            return res?.data;
    
        } catch (err) {
            console.error("^^^^^^^^^^^[QUERY]^^^^^^^^^^^ ERROR IN SENT QUERY: ", err?.message, " AND ", err?.response?.status, "AND: ", err?.response?.statusText);
            
            if(err?.response?.data) {
                console.error("ERROR DATA: ", err.response.data?.error?.message);

                if(err.response.data?.error?.errors[0]?.reason === "commentsDisabled") return "COMMENT DISABLED";
                else if(err.response.data?.error?.errors[0]?.reason === "videoNotFound") return "VIDEO NOT FOUND";
            }
            
            if(err?.response?.status === 403 && err?.response?.statusText === "quotaExceeded") return "QUERY QUOTA EXCEED";
            
            console.log("=>>>>> Replay ", i, "times");
            if(i === 2) return "FAILED QUERY";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

const queryDetail = async (base_url, part, list_ids, maxResults, API_KEY) => {
    let url = base_url + "?part=" + part.join("%2C")
            + "&id=" + list_ids.join("%2C")
            + "&maxResults=" + maxResults
            + "&key=" + API_KEY;

    for(let i=0; i<3; i += 1) {
        try {
            let res = await axios.get(url);
            console.log("SEND QUERY DETAIL SUCCESS");
            return res?.data;
    
        } catch (err) {
            console.error("^^^^^^^^^^^[QUERY]^^^^^^^^^^^ ERROR IN SENT QUERY: ", err?.message);
            console.log("ERROR CODE: ", err?.response?.status, " ERROR STATUS: ", err?.response?.statusText);
            console.error("LIST ERROR: ", err?.response?.data?.error?.errors);

            if(err?.response?.data?.error?.errors[0]?.reason ===  'quotaExceeded') return "QUERY QUOTA EXCEED";
            // else if(err?.response?.status === 403 && err?.response?.statusText === "Forbidden") return "QUERY 403";
            
            console.log("=>>>>> Replay ", i, "times");
            if(i === 2) return "FAILED QUERY DETAIL";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

const queryUpdateComment = async (base_url, id, key) => {
    let url = `${base_url}?part=snippet&id=${id}&key=${key}`;
    
    for(let i=0; i<3; i += 1) {
        try {
            let res = await axios.get(url);
            console.log("SEND QUERY UPDATE COMMENT SUCCESS");
            return res?.data;
    
        } catch (err) {
            console.error("^^^^^^^^^^^[QUERY]^^^^^^^^^^^ ERROR IN SENT QUERY: ", err?.message, " AND ", err?.response?.status, "AND: ", err?.response?.statusText);
            
            if(err?.response?.data) {
                console.error("ERROR DATA: ", err.response.data);
                console.error("LIST ERROR: ", err.response.data?.error?.errors);
            }
            
            if(err?.response?.status === 403 && err?.response?.statusText === "quotaExceeded") return "QUERY QUOTA EXCEED";
            
            console.log("=>>>>> Replay ", i, "times");
            if(i === 2) return "FAILED QUERY";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

module.exports = {queryVideoId, queryCommentThreads, queryDetail, queryUpdateComment};

