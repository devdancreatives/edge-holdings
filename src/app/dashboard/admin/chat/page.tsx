'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { GET_ADMIN_CHATS, ADMIN_REPLY_CHAT, ADMIN_CLOSE_CHAT } from '@/graphql/queries'
import { MessageSquare, User, Shield, Send, CheckCircle2, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminChatPage() {
    const { data, loading, refetch } = useQuery<any>(GET_ADMIN_CHATS, { pollInterval: 5000 })
    const [replyChat] = useMutation(ADMIN_REPLY_CHAT)

    // Admin state for selected chat
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
    const [replyContent, setReplyContent] = useState('')
    const [closeChat, { loading: closing }] = useMutation(ADMIN_CLOSE_CHAT)

    if (loading && !data) return <div className="p-8 text-zinc-600 dark:text-zinc-400">Loading chats...</div>

    const chats = data?.adminChats || []
    const selectedChat = chats.find((c: any) => c.id === selectedChatId)

    const handleSendReply = async () => {
        if (!selectedChatId || !replyContent.trim()) return

        try {
            await replyChat({ variables: { chatId: selectedChatId, content: replyContent } })
            setReplyContent('')
            refetch()
        } catch (e) {
            console.error(e)
            alert('Failed to send reply')
        }
    }

    return (
        <div className="flex h-full flex-col lg:flex-row gap-4">
            {/* Sidebar List */}
            <div className={`w-full lg:w-80 flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden ${selectedChatId ? 'hidden lg:flex' : 'flex'}`}>
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <h2 className="font-semibold text-zinc-900 dark:text-white">Conversations</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {chats.map((chat: any) => (
                        <button
                            key={chat.id}
                            onClick={() => setSelectedChatId(chat.id)}
                            className={`w-full p-4 text-left border-b border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-100 dark:bg-zinc-800 transition-colors ${selectedChatId === chat.id ? 'bg-zinc-100 dark:bg-zinc-800 border-l-2 border-l-yellow-500' : ''}`}
                        >
                            <div className="flex justify-between mb-1">
                                <span className="font-medium text-zinc-900 dark:text-white text-sm">{chat.user?.fullName}</span>
                                <span className="text-xs text-zinc-500">{format(new Date(chat.updatedAt), 'MMM d')}</span>
                            </div>
                            <div className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                                {chat.messages?.[chat.messages.length - 1]?.content || 'Empty chat'}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${chat.status === 'open' ? 'bg-green-500/10 text-green-500' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
                                    {chat.status}
                                </span>
                            </div>
                        </button>
                    ))}
                    {chats.length === 0 && (
                        <div className="p-8 text-center text-zinc-500 text-sm">No active chats</div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden ${!selectedChatId ? 'hidden lg:flex' : 'flex'}`}>
                {!selectedChat ? (
                    <div className="flex-1 flex items-center justify-center text-zinc-500">
                        Select a conversation to reply
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    onClick={() => setSelectedChatId(null)}
                                    className="lg:hidden p-2 -ml-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-zinc-900 dark:text-white truncate">{selectedChat.user?.fullName || 'Unknown User'}</h3>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{selectedChat.user?.email || 'No Email'}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-8 sm:pl-0">
                                <div className="text-xs text-zinc-500 font-mono shrink-0">
                                    ID: {selectedChat.id.slice(0, 8)} • <span className={`uppercase font-bold ${selectedChat.status === 'open' ? 'text-green-500' : 'text-zinc-500'}`}>{selectedChat.status}</span>
                                </div>
                                {selectedChat.status?.toLowerCase() === 'open' && (
                                    <button
                                        onClick={async () => {
                                            if (!confirm('Close this chat?')) return;
                                            await closeChat({ variables: { chatId: selectedChat.id } });
                                            refetch();
                                        }}
                                        disabled={closing}
                                        className="px-3 py-1.5 text-xs font-bold text-red-100 bg-red-600/20 border border-red-500/50 rounded hover:bg-red-500/30 transition-colors shrink-0 whitespace-nowrap"
                                    >
                                        {closing ? 'Closing...' : 'Close Chat'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {selectedChat.messages?.map((msg: any) => {
                                const isAdmin = msg.senderRole === 'admin'
                                return (
                                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex max-w-[80%] gap-3 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isAdmin ? 'bg-blue-500/20 text-blue-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                                {isAdmin ? <Shield size={14} /> : <User size={14} />}
                                            </div>
                                            <div className={`rounded-2xl px-4 py-2 ${isAdmin ? 'bg-blue-600 text-zinc-900 dark:text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'}`}>
                                                <p className="text-sm">{msg.content}</p>
                                                <span className={`mt-1 block text-[10px] ${isAdmin ? 'text-blue-200' : 'text-zinc-500'}`}>
                                                    {format(new Date(msg.createdAt), 'HH:mm')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                    placeholder="Type your reply..."
                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 pr-12 text-sm text-zinc-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                                />
                                <button
                                    onClick={handleSendReply}
                                    disabled={!replyContent.trim()}
                                    className="absolute right-2 top-2 p-1.5 text-blue-500 hover:bg-blue-500/10 rounded disabled:opacity-50"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
