import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Mail, Clock, Shield } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Document } from "@shared/schema";

interface ShareDocumentDialogProps {
  document: Document;
  children?: React.ReactNode;
}

export default function ShareDocumentDialog({ document, children }: ShareDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [accessLevel, setAccessLevel] = useState("view");
  const [expiresIn, setExpiresIn] = useState("0");
  const [shareLink, setShareLink] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing shares
  const { data: shares } = useQuery({
    queryKey: [`/api/documents/${document.id}/shares`],
    enabled: open && !!document.id,
  });

  // Create share mutation
  const shareMutation = useMutation({
    mutationFn: async (shareData: any) => {
      const response = await apiRequest('POST', `/api/documents/${document.id}/share`, shareData);
      return response.json();
    },
    onSuccess: (data) => {
      setShareLink(data.shareLink);
      toast({
        title: "Document shared successfully",
        description: `Share link created for ${email}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/shares`] });
      
      // Reset form
      setEmail("");
      setMessage("");
      setAccessLevel("view");
      setExpiresIn("0");
    },
    onError: (error) => {
      toast({
        title: "Failed to share document",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Revoke share mutation
  const revokeMutation = useMutation({
    mutationFn: async (shareId: number) => {
      const response = await apiRequest('DELETE', `/api/documents/${document.id}/shares/${shareId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Share revoked",
        description: "Access has been removed",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/shares`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to revoke share",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleShare = () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address to share with",
        variant: "destructive",
      });
      return;
    }

    shareMutation.mutate({
      email,
      message,
      accessLevel,
      expiresIn: expiresIn === "0" ? null : parseInt(expiresIn),
    });
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Share "{document.originalFilename}" with your team members for collaboration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Share form */}
          <div className="space-y-4 border rounded-lg p-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-share-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Hey, check out this document analysis..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[80px]"
                data-testid="textarea-share-message"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="access">Access level</Label>
                <Select value={accessLevel} onValueChange={setAccessLevel}>
                  <SelectTrigger id="access" data-testid="select-access-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">
                      <div className="flex items-center">
                        <Shield className="h-3 w-3 mr-2" />
                        View only
                      </div>
                    </SelectItem>
                    <SelectItem value="comment">
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-2" />
                        Can comment
                      </div>
                    </SelectItem>
                    <SelectItem value="edit">
                      <div className="flex items-center">
                        <Shield className="h-3 w-3 mr-2" />
                        Can edit
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires">Expires in</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger id="expires" data-testid="select-expires">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-2" />
                        Never
                      </div>
                    </SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="168">7 days</SelectItem>
                    <SelectItem value="720">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleShare} 
              className="w-full"
              disabled={shareMutation.isPending}
              data-testid="button-share-document"
            >
              {shareMutation.isPending ? "Sharing..." : "Share Document"}
            </Button>
          </div>

          {/* Share link display */}
          {shareLink && (
            <div className="space-y-2 border rounded-lg p-4 bg-green-50 dark:bg-green-950">
              <Label>Share link created!</Label>
              <div className="flex gap-2">
                <Input
                  value={shareLink}
                  readOnly
                  className="flex-1"
                  data-testid="input-share-link"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyShareLink}
                  data-testid="button-copy-link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can access the document based on the permissions you set
              </p>
            </div>
          )}

          {/* Active shares list */}
          {shares && shares.length > 0 && (
            <div className="space-y-2">
              <Label>Active shares</Label>
              <div className="border rounded-lg divide-y">
                {shares.map((share: any) => (
                  <div key={share.id} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{share.sharedWithEmail}</p>
                      <p className="text-xs text-muted-foreground">
                        {share.accessLevel} access • 
                        {share.accessedAt ? ` Last accessed ${new Date(share.accessedAt).toLocaleDateString()}` : ' Not accessed yet'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => revokeMutation.mutate(share.id)}
                      disabled={revokeMutation.isPending}
                      data-testid={`button-revoke-${share.id}`}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}