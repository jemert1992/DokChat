import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VerificationItem {
  id: number;
  documentId: number;
  uncertaintyScore: number;
  needsManualReview: boolean;
  reviewReason: string;
  verificationStatus: string;
  createdAt: string;
  document?: {
    id: number;
    originalFilename: string;
    industry: string;
  };
}

export function ManualReviewQueue() {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  // Fetch pending review items
  const { data: reviewItems, isLoading } = useQuery<VerificationItem[]>({
    queryKey: ['/api/verifications/pending-review']
  });

  // Mark item as reviewed
  const reviewMutation = useMutation({
    mutationFn: async ({ verificationId, notes }: { verificationId: number; notes: string }) => {
      const response = await apiRequest('POST', `/api/verifications/${verificationId}/review`, { reviewNotes: notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/verifications/pending-review'] });
      setSelectedItem(null);
      setReviewNotes("");
      toast({
        title: "Review Complete",
        description: "The item has been marked as reviewed."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Review Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleReview = (verificationId: number) => {
    reviewMutation.mutate({ verificationId, notes: reviewNotes });
  };

  if (isLoading) {
    return (
      <Card data-testid="card-review-queue">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Manual Review Queue
          </CardTitle>
          <CardDescription>Loading pending review items...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const pendingCount = reviewItems?.length || 0;

  return (
    <Card data-testid="card-review-queue">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Manual Review Queue
            </CardTitle>
            <CardDescription>
              Documents requiring human verification
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300" data-testid="badge-pending-count">
            {pendingCount} Pending
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {pendingCount === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="text-no-reviews">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p>No items pending review</p>
            <p className="text-sm mt-1">All verifications are complete</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviewItems?.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                data-testid={`card-review-item-${item.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="font-medium" data-testid={`text-filename-${item.id}`}>
                        {item.document?.originalFilename || `Document #${item.documentId}`}
                      </span>
                      <Badge variant="outline" className="text-xs" data-testid={`badge-industry-${item.id}`}>
                        {item.document?.industry}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      <strong>Reason:</strong> {item.reviewReason}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Uncertainty: </span>
                      <span className={`font-medium ${item.uncertaintyScore > 0.5 ? 'text-red-600' : 'text-yellow-600'}`} data-testid={`text-uncertainty-${item.id}`}>
                        {(item.uncertaintyScore * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedItem(item.id === selectedItem ? null : item.id)}
                    data-testid={`button-review-${item.id}`}
                  >
                    {item.id === selectedItem ? 'Cancel' : 'Review'}
                  </Button>
                </div>

                {/* Review Form */}
                {selectedItem === item.id && (
                  <div className="space-y-3 pt-3 border-t">
                    <Textarea
                      placeholder="Add review notes..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="min-h-[80px]"
                      data-testid={`textarea-review-notes-${item.id}`}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReview(item.id)}
                        disabled={reviewMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid={`button-submit-review-${item.id}`}
                      >
                        {reviewMutation.isPending ? 'Submitting...' : 'Mark as Reviewed'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(null);
                          setReviewNotes("");
                        }}
                        data-testid={`button-cancel-review-${item.id}`}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
