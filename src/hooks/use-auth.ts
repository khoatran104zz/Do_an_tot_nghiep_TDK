import { useMutation } from '@tanstack/react-query';
import { authClientService } from '@/services/auth.service';
import { RegisterInput } from '@/modules/auth/auth.schema';
import { toast } from 'sonner';

export function useRegisterUser() {
  return useMutation({
    mutationFn: (data: RegisterInput) => authClientService.register(data),
    onSuccess: () => {
      toast.success('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại!');
    },
  });
}
