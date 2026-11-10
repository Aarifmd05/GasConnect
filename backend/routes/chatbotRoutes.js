
import express from 'express';

const router = express.Router();

const chatbotResponses = [
    {
        keywords: ['hello', 'hi', 'hey'],
        priority: 1,
        answer: 'Hello! Welcome to GasConnect. I am here to help you with gas services, bookings, technicians and payments. Please select a help topic or type your question.'
    },
    {
        keywords: ['cancel', 'cancellation', 'cancelled'],
        priority: 10,
        answer: 'You can cancel a booking while its status is Pending or Assigned. Open your customer dashboard, go to your bookings and select the cancellation option for the relevant booking.'
    },
    {
        keywords: ['service', 'services', 'repair', 'category', 'categories', 'types'],
        priority: 8,
        answer: 'GasConnect provides domestic and commercial gas repair services. You can explore the available repair categories in the Services section of your customer dashboard. Select a service to view its details and pricing.'
    },
    {
        keywords: ['booking', 'book', 'appointment', 'schedule'],
        priority: 5,
        answer: 'To book a service, log in to your customer account, open the Services section, select your required repair service, choose an available date and provide your address. Submit your booking to proceed.'
    },
    {
        keywords: ['technician', 'mechanic', 'assigned', 'worker'],
        priority: 7,
        answer: 'After your booking is accepted, an approved technician is assigned by the admin. You can check the assigned technician details and booking status in your customer dashboard.'
    },
    {
        keywords: ['price', 'pricing', 'cost', 'charge', 'charges', 'fee'],
        priority: 6,
        answer: 'Service prices are displayed in the Services section. Select a repair service to view its listed price before booking.'
    },
    {
        keywords: ['payment', 'pay', 'paid', 'transaction'],
        priority: 6,
        answer: 'For payment-related assistance, please contact GasConnect support. Keep your booking details and transaction information ready when requesting help.'
    },
    {
        keywords: ['availability', 'available', 'location', 'area', 'coverage'],
        priority: 6,
        answer: 'Service availability depends on your location and the services offered by GasConnect. Please check the Services section or contact support to confirm availability in your area.'
    },
    {
        keywords: ['thank', 'thanks'],
        priority: 2,
        answer: 'You are welcome! Thank you for choosing GasConnect. We are happy to help!'
    },
    {
        keywords: ['support', 'contact', 'help', 'assistance'],
        priority: 3,
        answer: 'For additional assistance, please contact the GasConnect support team. You can also explore the help topics in this chat.'
    }
];

// POST - Customer sends a chatbot message
router.post('/chat', (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                message: 'Please enter a valid message'
            });
        }

        const userMessage = message.toLowerCase();

        // Extract complete words
        const words = userMessage.match(/\b[a-z]+\b/g) || [];

        // Find all matching topics
        const matchedResponses = chatbotResponses
            .filter(item =>
                item.keywords.some(keyword =>
                    words.includes(keyword.toLowerCase())
                )
            )
            .sort((a, b) => b.priority - a.priority);

        // Select the highest-priority response
        const reply = matchedResponses.length > 0
            ? matchedResponses[0].answer
            : 'Sorry, I could not understand your question. Please select one of the help topics or contact GasConnect support for further assistance.';

        return res.status(200).json({
            userMessage: message,
            reply
        });

    } catch (error) {
        console.error('Chatbot error:', error);

        return res.status(500).json({
            message: 'Chatbot Server Error'
        });
    }
});

export default router;
