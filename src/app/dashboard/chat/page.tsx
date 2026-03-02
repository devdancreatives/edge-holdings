'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { GET_MY_CHATS, CREATE_CHAT, SEND_MESSAGE } from '@/graphql/queries'
import { Send, MessageSquare, User, Shield } from 'lucide-react'
import { format } from 'date-fns'

interface Message {
    id: string
    content: string
    senderRole: 'user' | 'admin'
    read: boolean
    createdAt: string
}

interface Chat {
    id: string
    status: string
    updatedAt: string
    messages: Message[]
}

interface GetMyChatsData {
    myChats: Chat[]
}

interface CreateChatData {
    createChat: Chat
}

interface CreateChatVars {
    initialMessage: string
}

interface SendMessageData {
    sendMessage: Message
}

interface SendMessageVars {
    chatId: string
    content: string
}

export default function ChatPage() {
    const { data, loading, refetch } = useQuery<GetMyChatsData>(GET_MY_CHATS, {
        pollInterval: 5000, // Real-time-ish updates
    })
    const [createChat, { loading: creating }] = useMutation<CreateChatData, CreateChatVars>(CREATE_CHAT)
    const [sendMessage, { loading: sending }] = useMutation<SendMessageData, SendMessageVars>(SEND_MESSAGE)

    const [input, setInput] = useState('')
    const [activeChatId, setActiveChatId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const chats = data?.myChats || []

    // Auto-select latest chat if exists. 
    // If the latest chat is closed, we still select it so the user sees the history and the "Start New Chat" button.
    useEffect(() => {
        if (!activeChatId && chats.length > 0) {
            setActiveChatId(chats[0].id)
        }
    }, [chats, activeChatId])

    const activeChat = chats.find((c) => c.id === activeChatId)
    const messages = activeChat?.messages || []

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim()) return

        const originalInput = input
        setInput('') // Optimistically clear input

        try {
            if (!activeChatId) {
                // Create new chat
                const { data } = await createChat({
                    variables: { initialMessage: originalInput }
                })
                if (data?.createChat) {
                    setActiveChatId(data.createChat.id)
                }
            } else {
                // Send to existing
                await sendMessage({
                    variables: { chatId: activeChatId, content: originalInput }
                })
            }
            refetch()
        } catch (error) {
            console.error('Error sending message:', error)
            setInput(originalInput) // Restore input on error
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    if (loading && !data) {
        return <div className="p-8 text-center text-zinc-400">Loading chat...</div>
    }

    return (
        <div className="flex h-full flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="border-b border-zinc-800 bg-zinc-900/50 p-3 sm:p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-white">Support Chat</h2>
                        <p className="text-xs text-zinc-400">
                            {activeChatId ? 'Ticket #' + activeChatId.slice(0, 8) : 'Start a new conversation'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4">
                {messages.length === 0 && !activeChatId ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-zinc-500">
                        <MessageSquare size={48} className="mb-4 opacity-20" />
                        <p>No messages yet.</p>
                        <p className="text-sm">Send a message to start chatting with support.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isUser = msg.senderRole === 'user'
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex max-w-[85%] sm:max-w-[80%] gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isUser ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                        {isUser ? <User size={14} /> : <Shield size={14} />}
                                    </div>
                                    <div
                                        className={`rounded-2xl px-3 py-2 sm:px-4 ${isUser
                                            ? 'bg-yellow-500 text-black'
                                            : 'bg-zinc-800 text-zinc-200'
                                            }`}
                                    >
                                        <p className="text-sm wrap-break-word">{msg.content}</p>
                                        <span className={`mt-1 block text-[10px] ${isUser ? 'text-black/60' : 'text-zinc-500'}`}>
                                            {format(new Date(msg.createdAt), 'HH:mm')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-zinc-800 bg-zinc-900 p-3 sm:p-4 pb-safe">
                {activeChat?.status === 'closed' ? (
                    <div className="flex flex-col items-center gap-3 py-2">
                        <p className="text-zinc-500 text-sm">This chat session has been closed.</p>
                        <button
                            onClick={() => setActiveChatId(null)}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <MessageSquare size={16} />
                            Start New Chat
                        </button>
                    </div>
                ) : (
                    <div className="relative flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Type a message..."
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 pr-12 text-sm text-white placeholder-zinc-500 focus:border-yellow-500/50 focus:outline-hidden focus:ring-1 focus:ring-yellow-500/50 appearance-none"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || creating || sending}
                            className="absolute right-2 p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
