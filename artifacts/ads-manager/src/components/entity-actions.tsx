import { useState } from "react";
import { MoreHorizontal, Copy, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteCampaign,
  useDuplicateCampaign,
  getListCampaignsQueryKey,
  useDeleteAdSet,
  useDuplicateAdSet,
  getListAdSetsQueryKey,
  useDeleteAd,
  useDuplicateAd,
  getListAdsQueryKey,
} from "@workspace/api-client-react";

export type EntityType = "campaign" | "adset" | "ad";

interface EntityActionsProps {
  type: EntityType;
  id: number;
  name: string;
  onEdit: () => void;
}

export function EntityActions({ type, id, name, onEdit }: EntityActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteCampaign = useDeleteCampaign();
  const duplicateCampaign = useDuplicateCampaign();
  const deleteAdSet = useDeleteAdSet();
  const duplicateAdSet = useDuplicateAdSet();
  const deleteAd = useDeleteAd();
  const duplicateAd = useDuplicateAd();

  const handleDuplicate = () => {
    const opts = {
      onSuccess: () => {
        toast({ title: "Duplicated successfully" });
        if (type === "campaign") queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
        if (type === "adset") queryClient.invalidateQueries({ queryKey: getListAdSetsQueryKey() });
        if (type === "ad") queryClient.invalidateQueries({ queryKey: getListAdsQueryKey() });
      },
      onError: () => toast({ title: "Failed to duplicate", variant: "destructive" })
    };

    if (type === "campaign") duplicateCampaign.mutate({ id }, opts);
    if (type === "adset") duplicateAdSet.mutate({ id }, opts);
    if (type === "ad") duplicateAd.mutate({ id }, opts);
  };

  const handleDelete = () => {
    const opts = {
      onSuccess: () => {
        toast({ title: "Deleted successfully" });
        if (type === "campaign") queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
        if (type === "adset") queryClient.invalidateQueries({ queryKey: getListAdSetsQueryKey() });
        if (type === "ad") queryClient.invalidateQueries({ queryKey: getListAdsQueryKey() });
        setDeleteOpen(false);
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" })
    };

    if (type === "campaign") deleteCampaign.mutate({ id }, opts);
    if (type === "adset") deleteAdSet.mutate({ id }, opts);
    if (type === "ad") deleteAd.mutate({ id }, opts);
  };

  const isPending = deleteCampaign.isPending || deleteAdSet.isPending || deleteAd.isPending;
  const isDuplicating = duplicateCampaign.isPending || duplicateAdSet.isPending || duplicateAd.isPending;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" title="Actions">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDuplicate}
            disabled={isDuplicating}
          >
            <Copy className="mr-2 h-4 w-4" />
            {isDuplicating ? "Duplicating..." : "Duplicate"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{name}</strong> and remove its data from our servers.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
