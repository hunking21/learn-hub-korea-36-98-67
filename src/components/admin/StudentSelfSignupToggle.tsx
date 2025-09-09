import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { userStore } from "@/store/userStore";
import { Users } from "lucide-react";

export function StudentSelfSignupToggle() {
  const [allowSelfSignup, setAllowSelfSignup] = useState(false);

  useEffect(() => {
    const settings = userStore.getSettings();
    setAllowSelfSignup(settings.allowStudentSelfSignup);
  }, []);

  const handleToggle = (enabled: boolean) => {
    try {
      userStore.updateSettings({ allowStudentSelfSignup: enabled });
      setAllowSelfSignup(enabled);
      
      toast({
        title: "설정 변경됨",
        description: `학생 자가가입이 ${enabled ? '허용' : '차단'}되었습니다.`
      });
    } catch (error) {
      toast({
        title: "오류",
        description: "설정 변경에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          학생 자가가입 설정
        </CardTitle>
        <CardDescription>
          학생들이 직접 회원가입할 수 있도록 허용할지 설정합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Switch
            id="self-signup"
            checked={allowSelfSignup}
            onCheckedChange={handleToggle}
          />
          <Label htmlFor="self-signup" className="text-sm font-medium">
            학생 자가가입 허용
          </Label>
        </div>
        
        {allowSelfSignup && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              ✓ 학생들이 /signup 페이지에서 직접 가입할 수 있습니다.<br />
              ✓ 중복 아이디는 자동으로 방지됩니다.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}