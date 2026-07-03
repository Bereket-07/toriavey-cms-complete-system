import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Share2, Repeat, BarChart2 } from "lucide-react";

interface SocialMediaPreviewProps {
    platform: string;
    content: string;
    image?: string;
    hashtags?: string[];
    authorName?: string;
    authorHandle?: string;
    authorImage?: string;
    title?: string;
}

export function SocialMediaPreview({
    platform,
    content,
    image,
    hashtags = [],
    authorName = "Tori Avey",
    authorHandle = "toriavey",
    authorImage = "https://instagram.fadd3-1.fna.fbcdn.net/v/t51.2885-19/319917698_3376136805933432_1965354540529280412_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby44MDYuYzIifQ&_nc_ht=instagram.fadd3-1.fna.fbcdn.net&_nc_cat=100&_nc_oc=Q6cZ2QGaEyTKQVXUZtnwfqj2sUR4nvm_NnVtw8ws3-ajKp__uWrxdZF68wN7d__v7k0mtWQ&_nc_ohc=wTg5qcKRipsQ7kNvwEUBer0&_nc_gid=z9ghWAm-C4KBkY2DmU0vhg&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_AfjpzL-Qxke9TMy3PVfTxw4QbUF3AZaSHOZyxN7LDQrGjw&oe=69331937&_nc_sid=7a9f4b", // Tori Avey Profile Pic
    title
}: SocialMediaPreviewProps) {

    const renderInstagram = () => (
        <Card className="max-w-md mx-auto border-gray-200 shadow-sm overflow-hidden bg-white text-black font-sans text-xs">
            {/* Header */}
            <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 ring-2 ring-pink-500 ring-offset-1">
                        <AvatarImage src={authorImage} />
                        <AvatarFallback>TA</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold leading-none">{authorHandle}</p>
                        <p className="text-[10px] text-gray-500">Original Audio</p>
                    </div>
                </div>
                <MoreHorizontal className="h-4 w-4 text-gray-600" />
            </div>

            {/* Image - Reduced Height */}
            <div className="h-64 bg-gray-100 relative overflow-hidden">
                {image ? (
                    <img src={image} alt="Post content" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-2">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Heart className="h-5 w-5 hover:text-red-500 cursor-pointer transition-colors" />
                        <MessageCircle className="h-5 w-5 -rotate-90 hover:text-gray-600 cursor-pointer" />
                        <Send className="h-5 w-5 hover:text-gray-600 cursor-pointer" />
                    </div>
                    <Bookmark className="h-5 w-5 hover:text-gray-600 cursor-pointer" />
                </div>

                {/* Likes */}
                <p className="font-semibold mb-1">1,234 likes</p>

                {/* Caption - Clamped */}
                <div className="space-y-0.5">
                    <p className="line-clamp-2">
                        <span className="font-semibold mr-1">{authorHandle}</span>
                        {content}
                    </p>
                    {hashtags.length > 0 && (
                        <p className="text-blue-900 line-clamp-1 text-[10px]">
                            {hashtags.map(tag => `#${tag}`).join(' ')}
                        </p>
                    )}
                </div>

                {/* Comments Link */}
                <p className="text-gray-500 text-[10px] mt-1 cursor-pointer">View all 42 comments</p>
            </div>
        </Card>
    );

    const renderFacebook = () => (
        <Card className="max-w-md mx-auto border-gray-200 shadow-sm bg-white text-black font-sans text-xs">
            {/* Header */}
            <div className="p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={authorImage} />
                        <AvatarFallback>TA</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-gray-900">{authorName}</p>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <span>2h</span>
                            <span>•</span>
                            <span className="text-gray-400">🌎</span>
                        </div>
                    </div>
                </div>
                <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </div>

            {/* Content - Clamped */}
            <div className="px-2 pb-2 text-gray-900 whitespace-pre-wrap line-clamp-3">
                {content}
            </div>
            {hashtags.length > 0 && (
                <p className="px-2 pb-2 text-blue-600 text-[10px] line-clamp-1">
                    {hashtags.map(tag => `#${tag}`).join(' ')}
                </p>
            )}

            {/* Image - Reduced Height */}
            <div className="bg-gray-100 overflow-hidden h-48">
                {image ? (
                    <img src={image} alt="Post content" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="px-2 py-1 flex items-center justify-between text-[10px] text-gray-500 border-b border-gray-100">
                <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                        <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center text-white text-[6px]">👍</div>
                        <div className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center text-white text-[6px]">❤️</div>
                    </div>
                    <span>452</span>
                </div>
                <div className="flex gap-2">
                    <span>84 Comments</span>
                    <span>12 Shares</span>
                </div>
            </div>

            {/* Actions */}
            <div className="px-1 py-1 flex items-center justify-between">
                <button className="flex-1 flex items-center justify-center gap-1 py-1 hover:bg-gray-50 rounded-md text-gray-600 font-medium transition-colors">
                    <span className="text-sm">👍</span> Like
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 py-1 hover:bg-gray-50 rounded-md text-gray-600 font-medium transition-colors">
                    <MessageCircle className="h-4 w-4" /> Comment
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 py-1 hover:bg-gray-50 rounded-md text-gray-600 font-medium transition-colors">
                    <Share2 className="h-4 w-4" /> Share
                </button>
            </div>
        </Card>
    );

    const renderX = () => (
        <Card className="max-w-md mx-auto border-gray-100 shadow-sm bg-white text-black font-sans p-3 hover:bg-gray-50/50 transition-colors text-xs">
            <div className="flex gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={authorImage} />
                    <AvatarFallback>TA</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 truncate">
                            <span className="font-bold text-gray-900">{authorName}</span>
                            <span className="text-gray-500">@{authorHandle}</span>
                            <span className="text-gray-500">·</span>
                            <span className="text-gray-500 hover:underline cursor-pointer">2h</span>
                        </div>
                        <MoreHorizontal className="h-3 w-3 text-gray-500" />
                    </div>

                    {/* Content - Clamped */}
                    <div className="text-gray-900 mt-1 whitespace-pre-wrap leading-normal line-clamp-4">
                        {content}
                        {hashtags.length > 0 && (
                            <span className="text-blue-500 ml-1">
                                {hashtags.map(tag => `#${tag}`).join(' ')}
                            </span>
                        )}
                    </div>

                    {/* Image - Reduced Height */}
                    {image && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 h-40">
                            <img src={image} alt="Post content" className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-2 max-w-md text-gray-500">
                        <div className="flex items-center gap-1 group cursor-pointer hover:text-blue-500">
                            <MessageCircle className="h-3 w-3 group-hover:bg-blue-50 rounded-full p-0.5 box-content transition-colors" />
                            <span className="text-[10px]">12</span>
                        </div>
                        <div className="flex items-center gap-1 group cursor-pointer hover:text-green-500">
                            <Repeat className="h-3 w-3 group-hover:bg-green-50 rounded-full p-0.5 box-content transition-colors" />
                            <span className="text-[10px]">8</span>
                        </div>
                        <div className="flex items-center gap-1 group cursor-pointer hover:text-pink-500">
                            <Heart className="h-3 w-3 group-hover:bg-pink-50 rounded-full p-0.5 box-content transition-colors" />
                            <span className="text-[10px]">142</span>
                        </div>
                        <div className="flex items-center gap-1 group cursor-pointer hover:text-blue-500">
                            <BarChart2 className="h-3 w-3 group-hover:bg-blue-50 rounded-full p-0.5 box-content transition-colors" />
                            <span className="text-[10px]">2.4K</span>
                        </div>
                        <div className="group cursor-pointer hover:text-blue-500">
                            <Share2 className="h-3 w-3 group-hover:bg-blue-50 rounded-full p-0.5 box-content transition-colors" />
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );

    const renderPinterest = () => (
        <Card className="max-w-[280px] mx-auto border-transparent shadow-none bg-transparent text-black font-sans">
            <div className="relative group rounded-2xl overflow-hidden cursor-zoom-in">
                {/* Image */}
                {image ? (
                    <img src={image} alt="Pin" className="w-full h-auto object-cover" />
                ) : (
                    <div className="aspect-[2/3] w-full bg-gray-200 flex items-center justify-center text-gray-400">
                        No Image
                    </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute top-3 right-3">
                        <button className="bg-red-600 text-white font-semibold px-4 py-2 rounded-full text-sm hover:bg-red-700 transition-colors">
                            Save
                        </button>
                    </div>
                    <div className="absolute bottom-3 right-3 flex gap-2">
                        <div className="bg-white p-2 rounded-full hover:bg-gray-100 cursor-pointer shadow-sm">
                            <Share2 className="h-4 w-4" />
                        </div>
                        <div className="bg-white p-2 rounded-full hover:bg-gray-100 cursor-pointer shadow-sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="mt-2 px-1">
                <h3 className="font-semibold text-sm leading-tight mb-1 truncate">{title || content.split('\n')[0]}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={authorImage} />
                        <AvatarFallback>TA</AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-gray-700">{authorName}</p>
                </div>
            </div>
        </Card>
    );

    switch (platform.toLowerCase()) {
        case 'instagram': return renderInstagram();
        case 'facebook': return renderFacebook();
        case 'twitter':
        case 'x':
            return renderX();
        case 'pinterest': return renderPinterest();
        default: return renderInstagram();
    }
}
