
import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image, Smile, Plus } from "lucide-react";
import BearMascot from "@/components/bear-mascot";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Chatbot() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi, I am your AI assistant. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common emojis for quick access
  const commonEmojis = ["😊", "😂", "😢", "😍", "😘", "👶", "🍼", "😴", "🤗", "❤️", "👍", "👎"];

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, just add a message indicating an image was uploaded
      // In a real implementation, you'd upload the image and display it
      const userMessage: Message = {
        id: Date.now().toString() + "_user",
        text: `📷 Image uploaded: ${file.name}`,
        isUser: true,
        timestamp: new Date(),
      };

      const botMessage: Message = {
        id: Date.now().toString() + "_bot",
        text: "Hi, I am LetBabyTalk Chatbot.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage, botMessage]);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString() + "_user",
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    // Add bot response
    const botMessage: Message = {
      id: Date.now().toString() + "_bot",
      text: "Hi, I am LetBabyTalk Chatbot.",
      isUser: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
    setInputText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-pink-500 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <BearMascot size="small" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg">Hi, Baby 👶</h1>
            <p className="text-white/90 text-sm">Age: 10 weeks</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 pb-24 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
            <div className={`flex items-start space-x-2 max-w-[80%] ${message.isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
              {!message.isUser && (
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <BearMascot size="small" className="w-6 h-6" />
                </div>
              )}
              {message.isUser && (
                <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <BearMascot size="small" className="w-6 h-6" />
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 ${
                  message.isUser
                    ? "bg-pink-500 text-white"
                    : "bg-white text-gray-800 shadow-sm border"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-lg mx-auto">
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="mb-3 p-3 bg-gray-50 rounded-2xl border">
              <div className="grid grid-cols-6 gap-2">
                {commonEmojis.map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-lg hover:bg-pink-100"
                    onClick={() => handleEmojiClick(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="resize-none border-gray-300 rounded-2xl pr-20 min-h-[44px] max-h-32"
                rows={1}
              />
              <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  onClick={handleImageUpload}
                >
                  <Image className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="h-11 w-11 rounded-full bg-pink-500 hover:bg-pink-600 p-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          {/* Hidden file input for image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {/* Bottom Action Buttons */}
          <div className="flex justify-center mt-3 space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600"
            >
              <Smile className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
