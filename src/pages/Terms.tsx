import AppLayout from "@/components/layout/AppLayout";

const Terms = () => {
  return (
    <AppLayout 
      title="이용약관" 
      showBackButton={true} 
      showHomeButton={true}
    >
      <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">제1조 (목적)</h2>
            <p className="text-muted-foreground leading-relaxed">
              이 약관은 TN Academy가 제공하는 온라인 교육 서비스의 이용조건 및 절차, 
              회사와 회원의 권리·의무·책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">제2조 (정의)</h2>
            <div className="space-y-2">
              <p className="text-muted-foreground">1. "서비스"란 TN Academy가 제공하는 모든 교육 관련 서비스를 의미합니다.</p>
              <p className="text-muted-foreground">2. "회원"이란 본 약관에 따라 서비스 이용계약을 체결한 자를 의미합니다.</p>
              <p className="text-muted-foreground">3. "계정"이란 서비스 이용을 위해 회원에게 부여된 고유 식별자를 의미합니다.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">제3조 (서비스 제공)</h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 다음과 같은 서비스를 제공합니다:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>온라인 교육 컨텐츠 제공</li>
              <li>학습 진도 관리 및 평가</li>
              <li>학습자 간 커뮤니티 서비스</li>
              <li>기타 교육 관련 부가 서비스</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">제4조 (회원가입)</h2>
            <p className="text-muted-foreground leading-relaxed">
              서비스 이용을 위해서는 회원가입이 필요하며, 정확한 정보를 제공해야 합니다.
              허위정보 제공 시 서비스 이용이 제한될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">제5조 (개인정보 보호)</h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 관련 법령에 따라 회원의 개인정보를 보호하며, 
              자세한 사항은 개인정보처리방침에서 확인할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">제6조 (서비스 이용료)</h2>
            <p className="text-muted-foreground leading-relaxed">
              서비스 이용료는 각 서비스별로 별도로 정하며, 
              결제 전 명확히 안내됩니다. 환불정책은 별도 규정에 따릅니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">제7조 (약관의 효력)</h2>
            <p className="text-muted-foreground leading-relaxed">
              본 약관은 서비스 회원가입 시점부터 효력을 발생하며, 
              약관 변경 시 사전에 공지합니다.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t text-sm text-muted-foreground">
          <p>시행일자: 2024년 1월 1일</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Terms;