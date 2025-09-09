import { useState } from "react";
import { Users, BookOpen, BarChart3, Settings, Home, FileText, GraduationCap, UserCheck, Shield, Database, Bell, Activity, Target, Link, History, CheckSquare } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const adminItems = [
  { title: "대시보드", url: "/admin", icon: Home },
  { title: "사용자 관리", url: "/admin/users", icon: Users },
  { title: "시험 관리", url: "/admin/tests", icon: FileText },
  { title: "배포·진행", url: "/admin/deployment", icon: GraduationCap },
  { title: "리뷰·결과", url: "/admin/reviews", icon: BarChart3 },
  { title: "설정", url: "/admin/settings", icon: Settings },
];

const teacherItems = [
  { title: "사용자 관리", url: "/admin/users", icon: Users },
  { title: "시험 관리", url: "/admin/tests", icon: FileText },
  { title: "리뷰·결과", url: "/admin/reviews", icon: BarChart3 },
];

export function AdminSidebar({ role }: { role: 'admin' | 'teacher' }) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const items = role === 'admin' ? adminItems : teacherItems;

  const isActive = (path: string) => {
    if (path === '/admin' || path === '/teacher') {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const isExpanded = items.some((i) => isActive(i.url));

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50";

  return (
    <Sidebar
      className={state === "collapsed" ? "w-14" : "w-60"}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground">
            {role === 'admin' ? '관리자 메뉴' : '선생님 메뉴'}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/admin' || item.url === '/teacher'}
                      className={({ isActive }) => getNavCls({ isActive })}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground">
            학생 영역
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" className="hover:bg-sidebar-accent/50">
                    <Home className="mr-2 h-4 w-4" />
                    {state !== "collapsed" && <span>메인 페이지</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}