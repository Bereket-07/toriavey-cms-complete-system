import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ScheduleEvent } from "@/components/calendar/ScheduleCalendar";

export default function EventModal({ open, onOpenChange, event }: { open: boolean; onOpenChange: (v:boolean)=>void; event?: ScheduleEvent; }) {
  if (!event) return null;
  const s = new Date(event.start);
  const e = new Date(event.end);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Scheduled Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-3">
            <Label className="text-right">Title</Label>
            <Input className="col-span-3" defaultValue={event.title} />
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <Label className="text-right">Start</Label>
            <Input className="col-span-3" defaultValue={`${s.toLocaleDateString()} ${s.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`} />
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <Label className="text-right">End</Label>
            <Input className="col-span-3" defaultValue={`${e.toLocaleDateString()} ${e.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`} />
          </div>
          <div>
            <Label>Caption</Label>
            <Textarea placeholder="Optional caption..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
