import { ref, onMounted } from 'vue';

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

// 存储更新公告数据
const announcements: Announcement[] = [
  {
  id: '2025-11-16',
  title: '游戏更新公告',
  content: '1. 优化了项目结构，主要给代码解耦，方便后续优化和改进',
  date: '2025-11-16'
  },
  {
  id: '2025-11-09',
  title: '游戏功能更新公告',
  content: '1. 给反制回合增加了开关，玩家可以自选是否开启反制回合\n2.本项目开源地址github.com/hadesfox/GwS，有需要反馈的问题可以到项目仓库提交issue，或者到我的B站频道“狐漠离”反馈',
  date: '2025-11-09'
  },
  {
  id: '2025-11-09',
  title: '游戏功能更新公告',
  content: '1. 新增更新公告系统\n2. 在主界面右上角添加了公告按钮\n3. 支持首次进入弹窗显示最新公告\n4. 可以查看所有历史更新记录',
  date: '2025-11-09'
  },
  {
    id: '2025-11-08',
    title: '版本更新公告',
    content: '1. 新增获胜后额外反制回合机制\n2. 优化了拾金不昧技能在原位置被占用时的处理逻辑\n',
    date: '2025-11-08'
  }
];

export function useUpdateAnnouncements() {
  const showNewAnnouncement = ref(false);
  const showAnnouncementsList = ref(false);
  const latestAnnouncement = ref<Announcement | null>(null);
  
  // 检查是否需要显示新公告
  const checkNewAnnouncement = () => {
    const lastViewedId = localStorage.getItem('lastViewedAnnouncementId');
    const newestAnnouncement = announcements[0]; // 最新的公告在数组第一个位置
    
    latestAnnouncement.value = newestAnnouncement;
    
    if (!lastViewedId || lastViewedId !== newestAnnouncement.id) {
      showNewAnnouncement.value = true;
    }
  };
  
  // 标记公告为已读
  const markAsRead = () => {
    if (latestAnnouncement.value) {
      localStorage.setItem('lastViewedAnnouncementId', latestAnnouncement.value.id);
      showNewAnnouncement.value = false;
    }
  };
  
  // 打开公告列表
  const openAnnouncementsList = () => {
    showAnnouncementsList.value = true;
  };
  
  // 关闭公告列表
  const closeAnnouncementsList = () => {
    showAnnouncementsList.value = false;
  };
  
  // 组件挂载时检查新公告
  onMounted(() => {
    checkNewAnnouncement();
  });
  
  return {
    announcements,
    showNewAnnouncement,
    showAnnouncementsList,
    latestAnnouncement,
    markAsRead,
    openAnnouncementsList,
    closeAnnouncementsList,
    checkNewAnnouncement
  };
}