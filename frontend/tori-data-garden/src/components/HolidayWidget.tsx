import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Star } from "lucide-react";
import { apiGet } from "@/lib/api";

interface Holiday {
    name: string;
    date: string;
    type: string;
}

export function HolidayWidget() {
    const { data: holidays, isLoading, isError, error } = useQuery<Holiday[]>({
        queryKey: ['holidays'],
        queryFn: async () => {
            // Using apiGet handles auth headers and base URL automatically
            return apiGet<Holiday[]>("/api/content/holidays?days=60");
        },
        staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    });

    if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading holidays...</div>;

    if (isError) {
        console.error("Holiday fetch error:", error);
        return <div className="p-4 text-sm text-red-500">Error loading holidays</div>;
    }

    if (!holidays || holidays.length === 0) {
        return <div className="p-4 text-sm text-muted-foreground">No upcoming holidays found.</div>;
    }

    return (
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Upcoming Holidays
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {holidays.map((holiday, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/50 transition-colors">
                        <div className={`mt-0.5 p-1.5 rounded-full ${holiday.type === 'Jewish Holiday'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-red-100 text-red-600'
                            }`}>
                            {holiday.type === 'Jewish Holiday' ? (
                                <Star className="h-3 w-3" />
                            ) : (
                                <span className="text-[10px] font-bold">US</span>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">{holiday.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(holiday.date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
