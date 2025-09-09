/**
 * 학생 관리 기능 자동 리그레션 테스트
 * 저장 기능이 정상적으로 작동하는지 확인
 */
export const runStudentManagementTest = () => {
  console.log('=== 학생 관리 자동 리그레션 테스트 시작 ===');
  
  try {
    // 1. Auth 세션 확인
    const authSession = localStorage.getItem('auth_session_v1');
    console.log('✓ Auth 세션 확인:', !!authSession);
    
    if (!authSession) {
      console.error('❌ 로그인이 필요합니다');
      return false;
    }
    
    const sessionData = JSON.parse(authSession);
    console.log('✓ 세션 데이터:', { 
      role: sessionData.role, 
      expired: Date.now() > sessionData.expiresAt 
    });
    
    // 2. memoryRepo.users 접근 테스트
    import('@/repositories/memoryRepo').then(({ memoryRepo }) => {
      console.log('✓ memoryRepo 로드 성공');
      
      // 3. 기존 학생 수 확인
      const initialStudents = memoryRepo.users.getStudents();
      console.log('✓ 기존 학생 수:', initialStudents.length);
      
      // 4. 테스트 학생 생성
      const testStudent = {
        username: `test_${Date.now()}`,
        password: '1111',
        name: '테스트 학생',
        role: 'STUDENT' as const,
        system: 'KR' as const,
        grade: 'G1',
        phone: '010-1234-5678',
        className: '테스트반',
        birthdate: '2010-01-01',
        gender: 'male' as const,
        isActive: true,
        permissions: {},
        privateNote: '자동 테스트 생성'
      };
      
      try {
        const createdStudent = memoryRepo.users.create(testStudent);
        console.log('✓ 학생 생성 성공:', createdStudent.id);
        
        // 5. 학생 수정 테스트
        const updatedStudent = memoryRepo.users.update(createdStudent.id, {
          name: '수정된 테스트 학생',
          className: '수정된반'
        });
        console.log('✓ 학생 수정 성공:', updatedStudent.name);
        
        // 6. 학생 목록 확인
        const updatedStudents = memoryRepo.users.getStudents();
        console.log('✓ 수정 후 학생 수:', updatedStudents.length);
        
        // 7. 비밀번호 재설정 테스트
        const newPassword = memoryRepo.users.resetPassword(createdStudent.id);
        console.log('✓ 비밀번호 재설정 성공:', newPassword);
        
        // 8. 테스트 데이터 정리
        memoryRepo.users.remove(createdStudent.id);
        const finalStudents = memoryRepo.users.getStudents();
        console.log('✓ 테스트 학생 삭제 성공, 최종 학생 수:', finalStudents.length);
        
        console.log('✅ 모든 테스트 통과 - 학생 관리 기능이 정상적으로 작동합니다');
        return true;
        
      } catch (error) {
        console.error('❌ 학생 관리 테스트 실패:', error);
        return false;
      }
    });
    
  } catch (error) {
    console.error('❌ 리그레션 테스트 실패:', error);
    return false;
  }
};

// 페이지 로드 시 자동 실행
if (window.location.pathname === '/admin/students') {
  setTimeout(() => {
    runStudentManagementTest();
  }, 1000);
}