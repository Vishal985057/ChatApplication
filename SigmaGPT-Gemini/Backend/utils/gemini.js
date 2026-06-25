import "dotenv/config";

const getGeminiAPIResponse = async(message) => {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: message
                }]
            }]
        })
    };

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            options
        );
        const data = await response.json();
        return data.candidates[0].content.parts[0].text; //reply
    } catch(err) {
        console.log(err);
    }
}

export default getGeminiAPIResponse;
