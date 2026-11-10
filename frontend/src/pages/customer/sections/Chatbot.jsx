
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  Bot,
  Send,
  UserRound,
  MessageCircle,
  RotateCcw,
  Wrench,
  CalendarDays,
  IndianRupee,
  CalendarX,
  CreditCard,
  CircleHelp
} from 'lucide-react';

import './Chatbot.css';

const API_URL = 'http://localhost:3006/api/chatbot';

const helpTopics = [
  {
    id: 1,
    label: 'Services & Repairs',
    icon: Wrench,
    question: 'What services and repair categories do you offer?'
  },
  {
    id: 2,
    label: 'Book a Service',
    icon: CalendarDays,
    question: 'How can I book a service?'
  },
  {
    id: 3,
    label: 'Service Pricing',
    icon: IndianRupee,
    question: 'How can I check service pricing?'
  },
  {
    id: 4,
    label: 'Technician Details',
    icon: UserRound,
    question: 'How can I know my assigned technician?'
  },
  {
    id: 5,
    label: 'Cancel Booking',
    icon: CalendarX,
    question: 'How can I cancel my booking?'
  },
  {
    id: 6,
    label: 'Payment Help',
    icon: CreditCard,
    question: 'I need help with payment.'
  },
  {
    id: 7,
    label: 'Other Questions',
    icon: CircleHelp,
    question: 'I have another question.'
  }
];

const welcomeMessage =
  'Hello! Welcome to GasConnect. How can I help you today?';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: welcomeMessage
    }
  ]);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages, loading]);

  // Send a message to the backend
  const sendMessage = async (text) => {
    const trimmedMessage = text.trim();

    if (!trimmedMessage || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: trimmedMessage
      }
    ]);

    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: trimmedMessage
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.reply
        }
      ]);
    } catch (error) {
      console.error('Chatbot error:', error);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle manually typed messages
  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(message);
  };

  // Handle clicking a help topic
  const handleTopicClick = (question) => {
    sendMessage(question);
  };

  // Start a new conversation
  const handleReset = () => {
    setMessage('');
    setLoading(false);

    setMessages([
      {
        role: 'assistant',
        content: welcomeMessage
      }
    ]);
  };

  return (
    <div className="customer-chatbot-page">

      {/* Chatbot Header */}
      <div className="chatbot-header">
        <div className="chatbot-header-info">
          <div className="chatbot-avatar">
            <Bot size={24} />
          </div>

          <div>
            <h2>GasConnect Assistant</h2>
            <span className="chatbot-online">
              <span className="online-dot"></span>
              Online
            </span>
          </div>
        </div>

        <button
          type="button"
          className="chatbot-reset"
          onClick={handleReset}
          title="Clear conversation"
        >
          <RotateCcw size={17} />
          New Chat
        </button>
      </div>

      {/* Chat Messages */}
      <div className="chatbot-messages">

        {messages.map((item, index) => (
          <React.Fragment key={index}>

            <div
              className={`chat-message ${
                item.role === 'user'
                  ? 'user-message'
                  : 'bot-message'
              }`}
            >
              <div className="chat-message-avatar">
                {item.role === 'user'
                  ? <UserRound size={18} />
                  : <Bot size={18} />}
              </div>

              <div className="chat-message-content">
                {item.content}
              </div>
            </div>

            {/* Show help topics only after the latest assistant response */}
            {item.role === 'assistant' &&
              index === messages.length - 1 &&
              !loading && (
                <div className="chatbot-help-topics">
                  <p className="chatbot-help-title">
                    What do you need help with?
                  </p>

                  <div className="chatbot-help-grid">
                    {helpTopics.map((topic) => {
                      const TopicIcon = topic.icon;

                      return (
                        <button
                          type="button"
                          key={topic.id}
                          className="chatbot-topic-button"
                          onClick={() =>
                            handleTopicClick(topic.question)
                          }
                          disabled={loading}
                        >
                          <TopicIcon size={18} />
                          <span>{topic.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

          </React.Fragment>
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="chat-message bot-message">
            <div className="chat-message-avatar">
              <Bot size={18} />
            </div>

            <div className="chat-message-content chatbot-typing">
              Typing...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

      </div>

      {/* Message Input */}
      <form
        className="chatbot-input-area"
        onSubmit={handleSend}
      >
        <input
          type="text"
          placeholder="Ask anything about GasConnect..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={!message.trim() || loading}
          title="Send message"
        >
          <Send size={19} />
        </button>
      </form>

      {/* Disclaimer */}
      <p className="chatbot-disclaimer">
        <MessageCircle size={13} />
        GasConnect Assistant provides general assistance.
      </p>

    </div>
  );
};

export default Chatbot;
