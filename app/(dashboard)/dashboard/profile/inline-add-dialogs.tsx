"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExperienceForm } from "./edit/experience-form";
import { ActivityForm } from "./edit/activity-form";
import { AchievementForm } from "./edit/achievement-form";

export function ExperienceDialog({ trigger }: { trigger: React.ReactElement }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Experience</DialogTitle>
        </DialogHeader>
        <ExperienceForm mode="create" onDone={() => { setOpen(false); router.refresh(); }} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function ActivityDialog({ trigger }: { trigger: React.ReactElement }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Activity</DialogTitle>
        </DialogHeader>
        <ActivityForm mode="create" onDone={() => { setOpen(false); router.refresh(); }} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function AchievementDialog({ trigger }: { trigger: React.ReactElement }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Achievement</DialogTitle>
        </DialogHeader>
        <AchievementForm mode="create" onDone={() => { setOpen(false); router.refresh(); }} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
