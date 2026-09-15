import { useMutation } from '@tanstack/react-query';
import { aiClientService } from '@/services/ai.service';
import { toast } from 'sonner';

export function useAIChat() {
  return useMutation({
    mutationFn: (message: string) => aiClientService.chat(message),
    onError: (err: any) => {
      toast.error(err.message || 'Không thể kết nối Trợ lý AI');
    },
  });
}

export function useClassifyIncident() {
  return useMutation({
    mutationFn: ({ title, content }: { title: string; content: string }) =>
      aiClientService.classifyIncident(title, content),
  });
}
