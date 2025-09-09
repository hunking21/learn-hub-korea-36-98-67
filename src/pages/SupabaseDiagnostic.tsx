import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const SupabaseDiagnostic = () => {
  const [sessionResult, setSessionResult] = useState<string>('');
  const [authSettingsResult, setAuthSettingsResult] = useState<string>('');
  const [dbPingResult, setDbPingResult] = useState<string>('');

  const SUPABASE_URL = "https://klotxqfcjlzdevohzqlm.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsb3R4cWZjamx6ZGV2b2h6cWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MjYwODksImV4cCI6MjA3MTAwMjA4OX0.XozLy3dxLDH8bEfXCQNSYP0XdPqvck1_XHIYrINGZaA";

  const handleAuthSessionCheck = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      console.log('Auth session data:', data);
      console.log('Auth session error:', error);
      
      const result = {
        data: data,
        error: error
      };
      
      const resultText = JSON.stringify(result, null, 2);
      setSessionResult(resultText);
      
      if (error) {
        toast({
          title: "Auth 세션 확인 실패",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Auth 세션 확인 성공",
          description: data.session ? "세션이 있습니다" : "세션이 없습니다"
        });
      }
    } catch (e) {
      const errorText = `Error: ${String(e)}`;
      setSessionResult(errorText);
      toast({
        title: "Auth 세션 확인 에러",
        description: errorText,
        variant: "destructive"
      });
    }
  };

  const handleAuthSettingsCheck = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        headers: {
          apikey: SUPABASE_ANON_KEY
        }
      });
      
      const result = await response.json();
      const resultText = JSON.stringify(result, null, 2);
      setAuthSettingsResult(resultText);
      
      if (response.ok) {
        toast({
          title: "Auth 설정 조회 성공",
          description: "설정을 가져왔습니다"
        });
      } else {
        toast({
          title: "Auth 설정 조회 실패",
          description: `Status: ${response.status}`,
          variant: "destructive"
        });
      }
    } catch (e) {
      const errorText = `Error: ${String(e)}`;
      setAuthSettingsResult(errorText);
      toast({
        title: "Auth 설정 조회 에러",
        description: errorText,
        variant: "destructive"
      });
    }
  };

  const handleDbPing = async () => {
    try {
      const { data, error } = await supabase.from('users').select('id').limit(1);
      console.log('DB ping data:', data);
      console.log('DB ping error:', error);
      
      const result = {
        data: data,
        error: error
      };
      
      const resultText = JSON.stringify(result, null, 2);
      setDbPingResult(resultText);
      
      if (error) {
        toast({
          title: "DB 핑 실패",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "DB 핑 성공",
          description: `${data?.length || 0}개 레코드 조회됨`
        });
      }
    } catch (e) {
      const errorText = `Error: ${String(e)}`;
      setDbPingResult(errorText);
      toast({
        title: "DB 핑 에러",
        description: errorText,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Supabase 연결 점검</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="text-sm text-yellow-700">
          <p className="mb-2">• URL이 비었거나 잘못되면 모든 버튼이 실패합니다.</p>
          <p>• RBAC/RLS와 무관하게 Auth 세션 확인이 먼저 통과되어야 합니다.</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>환경 변수</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm">
            <code>
{`NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY.substring(0, 6)}***`}
            </code>
          </pre>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Auth 세션 확인</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAuthSessionCheck} className="mb-4">
              Auth 세션 확인
            </Button>
            {sessionResult && (
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-60">
                <code>{sessionResult}</code>
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auth 설정 조회(REST)</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAuthSettingsCheck} className="mb-4">
              Auth 설정 조회(REST)
            </Button>
            {authSettingsResult && (
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-60">
                <code>{authSettingsResult}</code>
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DB 핑(users)</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDbPing} className="mb-4">
              DB 핑(users)
            </Button>
            {dbPingResult && (
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-60">
                <code>{dbPingResult}</code>
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupabaseDiagnostic;