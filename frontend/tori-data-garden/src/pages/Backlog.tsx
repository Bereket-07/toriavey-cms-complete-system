import { Clock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Backlog() {
  const data = [
    { date: "Oct 5", title: "Recipe Reel: Falafel Wrap", type: "Video", status: "Pending" },
    { date: "Oct 6", title: "Carousel: Pantry Staples", type: "Image", status: "Reviewed" },
    { date: "Oct 7", title: "Caption: Healthy Breakfast", type: "Text", status: "Pending" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Backlog"
        description="Missed or saved suggestions to review later"
        icon={Clock}
      />

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.title}</TableCell>
                <TableCell><Badge variant="secondary">{row.type}</Badge></TableCell>
                <TableCell>
                  <Badge className={row.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}>{row.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline">Review</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
