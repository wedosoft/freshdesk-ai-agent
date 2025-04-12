class ClaudeAPI {
    constructor(apiKey, model = 'claude-3-opus-20240229') {
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = 'https://api.anthropic.com/v1/messages';
    }

    async generateResponse(ticketData, context) {
        try {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 4000,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a helpful AI assistant for Freshdesk support. 
                            Your task is to help generate appropriate responses to customer tickets.
                            Consider the following context: ${JSON.stringify(context)}`
                        },
                        {
                            role: 'user',
                            content: `Please help generate a response for the following ticket:
                            Subject: ${ticketData.subject}
                            Description: ${ticketData.description}
                            Priority: ${ticketData.priority}
                            Status: ${ticketData.status}`
                        }
                    ]
                })
            };

            const response = await client.request.invoke('httpRequest', {
                url: this.baseUrl,
                options: options
            });

            if (!response.response) {
                throw new Error('No response from API');
            }

            const data = JSON.parse(response.response);
            const contentBlock = data.content.find(c => c.type === 'text');
            if (!contentBlock) {
                throw new Error('No text response from Claude');
            }
            return contentBlock.text;
        } catch (error) {
            console.error('Error generating response:', error);
            throw error;
        }
    }

    async searchSimilarTickets(ticketData, query) {
        try {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 4000,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a helpful AI assistant for Freshdesk support.
                            Your task is to find similar tickets based on the given query.
                            Return the results in JSON format with the following structure:
                            {
                                "results": [
                                    {
                                        "id": "ticket_id",
                                        "subject": "ticket_subject",
                                        "description": "ticket_description",
                                        "score": similarity_score
                                    }
                                ]
                            }`
                        },
                        {
                            role: 'user',
                            content: `Find similar tickets for the following query: ${query}
                            Current ticket details:
                            Subject: ${ticketData.subject}
                            Description: ${ticketData.description}`
                        }
                    ]
                })
            };

            const response = await client.request.invoke('httpRequest', {
                url: this.baseUrl,
                options: options
            });

            if (!response.response) {
                throw new Error('No response from API');
            }

            const data = JSON.parse(response.response);
            const contentBlock = data.content.find(c => c.type === 'text');
            if (!contentBlock) {
                throw new Error('No text response from Claude');
            }
            return JSON.parse(contentBlock.text);
        } catch (error) {
            console.error('Error searching similar tickets:', error);
            throw error;
        }
    }

    async searchFAQ(query) {
        try {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 4000,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a helpful AI assistant for Freshdesk support.
                            Your task is to find relevant FAQ entries based on the given query.
                            Return the results in JSON format with the following structure:
                            {
                                "results": [
                                    {
                                        "question": "faq_question",
                                        "answer": "faq_answer",
                                        "score": relevance_score
                                    }
                                ]
                            }`
                        },
                        {
                            role: 'user',
                            content: `Find relevant FAQ entries for the following query: ${query}`
                        }
                    ]
                })
            };

            const response = await client.request.invoke('httpRequest', {
                url: this.baseUrl,
                options: options
            });

            if (!response.response) {
                throw new Error('No response from API');
            }

            const data = JSON.parse(response.response);
            const contentBlock = data.content.find(c => c.type === 'text');
            if (!contentBlock) {
                throw new Error('No text response from Claude');
            }
            return JSON.parse(contentBlock.text);
        } catch (error) {
            console.error('Error searching FAQ:', error);
            throw error;
        }
    }
}

// Export the class for use in other files
window.ClaudeAPI = ClaudeAPI;