import AppLayout from "@/components/layout/AppLayout";

const Privacy = () => {
  return (
    <AppLayout 
      title="개인정보처리방침" 
      showBackButton={true} 
      showHomeButton={true}
    >
      <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. 개인정보의 처리목적</h2>
            <p className="text-muted-foreground leading-relaxed">
              TN Academy는 다음의 목적을 위하여 개인정보를 처리하고 있으며, 
              다음의 목적 이외의 용도로는 이용하지 않습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-3">
              <li>회원 가입의사 확인, 회원제 서비스 제공</li>
              <li>교육 서비스 제공 및 학습 관리</li>
              <li>고객 상담 및 민원 처리</li>
              <li>서비스 개선 및 맞춤형 서비스 제공</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. 개인정보의 처리 및 보유기간</h2>
            <p className="text-muted-foreground leading-relaxed">
              개인정보는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 
              개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 처리·보유합니다.
            </p>
            <div className="mt-3 space-y-2">
              <p className="text-muted-foreground">• 회원정보: 회원 탈퇴 시까지</p>
              <p className="text-muted-foreground">• 학습기록: 수강 완료 후 5년</p>
              <p className="text-muted-foreground">• 결제정보: 전자상거래법에 따라 5년</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. 처리하는 개인정보의 항목</h2>
            <p className="text-muted-foreground leading-relaxed">필수항목:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>성명, 이메일 주소, 휴대전화번호</li>
              <li>서비스 이용기록, 접속 로그, 쿠키</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">선택항목:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>생년월일, 성별, 주소</li>
              <li>학력 및 경력 정보</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. 개인정보의 제3자 제공</h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 원칙적으로 정보주체의 개인정보를 수집·이용 목적으로 명시한 범위 내에서 처리하며, 
              정보주체의 사전 동의 없이는 본래의 목적 범위를 초과하여 처리하거나 
              제3자에게 제공하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. 개인정보 처리의 위탁</h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
            </p>
            <div className="mt-3 space-y-2">
              <p className="text-muted-foreground">• 결제처리: 결제대행업체</p>
              <p className="text-muted-foreground">• 클라우드 서비스: AWS, Google Cloud</p>
              <p className="text-muted-foreground">• 고객상담: 전문 상담업체</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. 정보주체의 권리·의무 및 행사방법</h2>
            <p className="text-muted-foreground leading-relaxed">
              정보주체는 언제든지 다음과 같은 개인정보 보호 관련 권리를 행사할 수 있습니다.
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-3">
              <li>개인정보 처리현황 통지요구</li>
              <li>개인정보 열람요구</li>
              <li>개인정보 정정·삭제요구</li>
              <li>개인정보 처리정지 요구</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. 개인정보 보호책임자</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>• 성명: 홍길동</p>
              <p>• 직책: 개인정보보호책임자</p>
              <p>• 연락처: privacy@tnacademy.co.kr</p>
              <p>• 전화: 02-1234-5678</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. 개인정보의 안전성 확보조치</h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 
              및 물리적 조치를 하고 있습니다.
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-3">
              <li>개인정보 취급직원의 최소화 및 교육</li>
              <li>개인정보에 대한 접근 제한</li>
              <li>개인정보의 암호화</li>
              <li>해킹 등에 대비한 기술적 대책</li>
            </ul>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t text-sm text-muted-foreground">
          <p>시행일자: 2024년 1월 1일</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Privacy;