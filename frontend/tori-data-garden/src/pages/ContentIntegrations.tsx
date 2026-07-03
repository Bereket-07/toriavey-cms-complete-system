import { Plug } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const integrations = [
  { name: "WordPress", status: "Connected" },
  { name: "Vizard.ai", status: "Not Connected" },
  { name: "Klap", status: "Not Connected" },
  { name: "YouTube", status: "Connected" },
  { name: "Instagram", status: "Connected" },
];

export default function ContentIntegrations() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Content Integrations"
        description="Connect platforms used for content creation and publishing"
        icon={Plug}
      />

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {integrations.map((int) => (
          <Card key={int.name}>
            <CardHeader>
              <CardTitle>{int.name}</CardTitle>
              <CardDescription>Status: {int.status}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-24 rounded-md bg-muted" />
            </CardContent>
            <CardFooter>
              {int.status === 'Connected' ? (
                <Button variant="outline">Disconnect</Button>
              ) : (
                <Button>Connect</Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
