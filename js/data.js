/* MatchMate — mock data (personas, skill scales, matches).
   Dates are generated relative to "now" so the demo always looks fresh.
   Shape mirrors what a future Node mock API would return. */
window.MM_DATA = (function () {
  const SKILLS = {
    football: [
      { code: 'TC',   en: 'Beginner',          vi: 'Tập chơi' },
      { code: 'PTCB', en: 'Casual · basic',    vi: 'Phong trào cơ bản' },
      { code: 'PTNC', en: 'Casual · advanced', vi: 'Phong trào nâng cao' },
      { code: 'BC',   en: 'Semi-pro',          vi: 'Bán chuyên' },
      { code: 'CN',   en: 'Professional',      vi: 'Chuyên nghiệp' },
      { code: 'DC',   en: 'Elite',             vi: 'Đỉnh cao' }
    ],
    badminton: [
      { code: 'Yếu-', en: 'Weak −',               vi: 'Yếu −' },
      { code: 'Yếu',  en: 'Weak',                 vi: 'Yếu' },
      { code: 'Yếu+', en: 'Weak +',               vi: 'Yếu +' },
      { code: 'TBY',  en: 'Lower intermediate',   vi: 'Trung bình yếu' },
      { code: 'TB-',  en: 'Intermediate −',       vi: 'Trung bình −' },
      { code: 'TB',   en: 'Intermediate',         vi: 'Trung bình' },
      { code: 'TB+',  en: 'Intermediate +',       vi: 'Trung bình +' },
      { code: 'Khá',  en: 'Good',                 vi: 'Khá' },
      { code: 'BC',   en: 'Semi-pro',             vi: 'Bán chuyên' },
      { code: 'CN',   en: 'Professional',         vi: 'Chuyên nghiệp' }
    ]
  };

  const FORMATS = {
    football:  [
      { id: 'f5',  en: '5-a-side',  vi: 'Sân 5' },
      { id: 'f7',  en: '7-a-side',  vi: 'Sân 7' },
      { id: 'f11', en: '11-a-side', vi: 'Sân 11' }
    ],
    badminton: [
      { id: 'singles', en: 'Singles',       vi: 'Đánh đơn' },
      { id: 'doubles', en: 'Doubles',       vi: 'Đánh đôi' },
      { id: 'mixed',   en: 'Mixed doubles', vi: 'Đôi nam nữ' }
    ]
  };

  const PERSONAS = {
    host: {
      id: 'u-khoa',
      role: 'host',
      displayName: 'Khoa.Smash',
      fullName: 'Trần Minh Khoa',
      phone: '0901 234 567',
      initials: 'KS',
      age: 27,
      area: { en: 'District 10, HCMC', vi: 'Quận 10, TP.HCM' },
      job: { en: 'Software tester', vi: 'Kiểm thử phần mềm' },
      skill: { badminton: 6 },
      gamesPlayed: 48,
      hosted: 31,
      quote: {
        en: '“I book the court every Thursday. Filling the last two spots shouldn’t take 40 comments.”',
        vi: '“Tuần nào mình cũng đặt sân tối thứ 5. Kiếm 2 người cuối mà phải đọc 40 bình luận.”'
      },
      goals: {
        en: ['Fill doubles slots fast with players of a similar level', 'Approve each joiner before sharing a phone number', 'Reuse the same court without retyping the address'],
        vi: ['Lấp chỗ đánh đôi nhanh với người cùng trình', 'Duyệt từng người trước khi lộ số điện thoại', 'Dùng lại sân quen, không phải gõ lại địa chỉ']
      },
      pains: {
        en: ['Posts sink in Facebook groups within an hour', 'Strangers call at midnight after seeing the number', '“TB” means something different to everyone'],
        vi: ['Bài đăng trôi khỏi group Facebook sau 1 giờ', 'Người lạ gọi lúc nửa đêm vì thấy số điện thoại', 'Mỗi người hiểu “TB” một kiểu']
      }
    },
    joiner: {
      id: 'u-ha',
      role: 'joiner',
      displayName: 'Ha.Runner',
      fullName: 'Nguyễn Thu Hà',
      phone: '0938 765 432',
      initials: 'HR',
      age: 23,
      area: { en: 'Binh Thanh, HCMC', vi: 'Bình Thạnh, TP.HCM' },
      job: { en: 'Junior designer, new to the city', vi: 'Designer mới ra trường, mới lên thành phố' },
      home: { lat: 10.8105, lng: 106.7091 },
      radiusKm: 5,
      skill: { football: 1, badminton: 4 },
      // 0 = Sunday … 6 = Saturday
      availability: {
        0: ['morning'],
        1: ['evening'], 2: ['evening'], 3: ['evening'], 4: ['evening'], 5: ['evening'],
        6: ['morning', 'afternoon']
      },
      gamesPlayed: 12,
      quote: {
        en: '“I just want a friendly game after work — not a team that’s way better than me.”',
        vi: '“Mình chỉ muốn đá giao lưu sau giờ làm, đừng vào kèo toàn cao thủ.”'
      },
      goals: {
        en: ['Find games near home on weekday evenings', 'Know the level before showing up', 'Bring a friend along (+1)'],
        vi: ['Tìm kèo gần nhà vào tối các ngày trong tuần', 'Biết trước trình độ trước khi ra sân', 'Rủ thêm bạn đi cùng (+1)']
      },
      pains: {
        en: ['Doesn’t know anyone to play with yet', 'Hard to tell which posts are still open', 'Worried about sharing a phone number with strangers'],
        vi: ['Chưa quen ai để rủ chơi', 'Khó biết bài nào còn tuyển', 'Ngại để lộ số điện thoại cho người lạ']
      }
    }
  };

  const RECENT_COURTS = [
    { name: 'Sân cầu lông Hoa Sen', address: '214 Thành Thái, Phường 14, Quận 10', lat: 10.7735, lng: 106.6670 },
    { name: 'Nhà thi đấu Lạc Long Quân', address: '1A Lạc Long Quân, Phường 3, Quận 11', lat: 10.7625, lng: 106.6455 },
    { name: 'Sân cầu lông Phương Nam', address: '45 Sư Vạn Hạnh, Phường 12, Quận 10', lat: 10.7700, lng: 106.6700 }
  ];

  // dayOffset: days from today. Times are local (ICT).
  const RAW = [
    {
      id: 'm1', sport: 'badminton', format: 'doubles',
      title: { en: 'Thursday night doubles · TB to Khá', vi: 'Đánh đôi tối thứ 5 · TB đến Khá' },
      dayOffset: 1, h: 19, min: 0, dur: 120,
      venue: 'Sân cầu lông Hoa Sen', address: '214 Thành Thái, Q.10', lat: 10.7735, lng: 106.6670,
      total: 6, filled: 4, skillMin: 4, skillMax: 7,
      cost: 60000, costUnit: 'person', joinMode: 'pending',
      host: 'Khoa.Smash', hostId: 'u-khoa',
      notes: { en: 'Bring your own racket. Shuttles provided (Yonex AS-30).', vi: 'Tự mang vợt. Cầu có sẵn (Yonex AS-30).' }
    },
    {
      id: 'm2', sport: 'football', format: 'f7',
      title: { en: '7-a-side, 3 players short · friendly game', vi: 'Sân 7 thiếu 3 người · đá vui' },
      dayOffset: 1, h: 20, min: 0, dur: 90,
      venue: 'Sân bóng mini Thành Phát', address: '12 Nguyễn Xí, Bình Thạnh', lat: 10.8040, lng: 106.7140,
      total: 14, filled: 11, skillMin: 1, skillMax: 2,
      cost: 50000, costUnit: 'person', joinMode: 'auto',
      host: 'Tuan.FC', hostId: 'u-tuan',
      notes: { en: 'Bibs provided. Turf shoes only.', vi: 'Có áo bib. Chỉ mang giày đinh dăm.' }
    },
    {
      id: 'm7', sport: 'badminton', format: 'doubles',
      title: { en: 'After-work badminton in Binh Thanh', vi: 'Cầu lông sau giờ làm · Bình Thạnh' },
      dayOffset: 0, h: 19, min: 30, dur: 90,
      venue: 'Sân cầu lông Thanh Đa', address: '30 Bình Quới, Bình Thạnh', lat: 10.8060, lng: 106.6990,
      total: 8, filled: 5, skillMin: 3, skillMax: 6,
      cost: 50000, costUnit: 'person', joinMode: 'auto',
      host: 'Dat.CLB', hostId: 'u-dat',
      notes: { en: 'Relaxed rotation, everyone plays.', vi: 'Xoay vòng thoải mái, ai cũng được đánh.' }
    },
    {
      id: 'm4', sport: 'football', format: 'f5',
      title: { en: '5-a-side, Tuesday evening', vi: 'Kèo sân 5 tối thứ 3' },
      dayOffset: 2, h: 18, min: 30, dur: 60,
      venue: 'Sân bóng Chảo Lửa', address: '30 Phan Thúc Duyện, Tân Bình', lat: 10.7975, lng: 106.6650,
      total: 10, filled: 6, skillMin: 0, skillMax: 1,
      cost: 40000, costUnit: 'person', joinMode: 'pending',
      host: 'Hung.Q3', hostId: 'u-hung',
      notes: { en: 'Beginners welcome, no tackling.', vi: 'Người mới chơi thoải mái, không xoạc.' }
    },
    {
      id: 'm3', sport: 'badminton', format: 'singles',
      title: { en: 'Sunday morning singles · strong players', vi: 'Giao lưu đơn sáng CN · trình khá' },
      dayOffset: 3, h: 6, min: 30, dur: 90,
      venue: 'Sân cầu lông Phú Nhuận', address: '3 Hoàng Minh Giám, Phú Nhuận', lat: 10.7990, lng: 106.6800,
      total: 2, filled: 1, skillMin: 7, skillMax: 8,
      cost: 0, costUnit: 'person', joinMode: 'auto',
      host: 'Vy.Badminton', hostId: 'u-vy',
      notes: { en: 'Court is on me. Looking for a sparring partner.', vi: 'Mình bao sân. Cần bạn đánh tập cùng.' }
    },
    {
      id: 'm5', sport: 'badminton', format: 'mixed',
      title: { en: 'Mixed doubles, just for fun', vi: 'Đôi nam nữ vui vẻ' },
      dayOffset: 4, h: 19, min: 30, dur: 120,
      venue: 'Sân cầu lông Linh Trung', address: 'Kha Vạn Cân, TP. Thủ Đức', lat: 10.8490, lng: 106.7720,
      total: 4, filled: 3, skillMin: 3, skillMax: 5,
      cost: 200000, costUnit: 'total', joinMode: 'pending',
      host: 'Linh.Nam', hostId: 'u-linh',
      notes: { en: 'Need one more to make two pairs.', vi: 'Thiếu 1 người cho đủ 2 cặp.' }
    },
    {
      id: 'm8', sport: 'football', format: 'f7',
      title: { en: 'Need a goalkeeper and 1 defender', vi: 'Tìm 1 thủ môn + 1 hậu vệ' },
      dayOffset: 1, h: 19, min: 0, dur: 90,
      venue: 'Sân bóng K34', address: 'Cộng Hòa, Tân Bình', lat: 10.8010, lng: 106.6520,
      total: 14, filled: 12, skillMin: 1, skillMax: 3,
      cost: 60000, costUnit: 'person', joinMode: 'pending',
      host: 'Phong.GK', hostId: 'u-phong',
      notes: { en: 'Goalkeeper plays free.', vi: 'Thủ môn miễn phí.' }
    },
    {
      id: 'm6', sport: 'football', format: 'f11',
      title: { en: 'Weekend full-size match', vi: 'Sân 11 cuối tuần' },
      dayOffset: 5, h: 16, min: 0, dur: 120,
      venue: 'Sân vận động Quận 7', address: 'Nguyễn Thị Thập, Quận 7', lat: 10.7330, lng: 106.7210,
      total: 22, filled: 22, skillMin: 3, skillMax: 4,
      cost: 80000, costUnit: 'person', joinMode: 'auto',
      host: 'Saigon.Sunday.XI', hostId: 'u-ssxi',
      notes: { en: 'Full — waitlist via host.', vi: 'Đã đủ người.' }
    }
  ];

  function atOffset(dayOffset, h, min) {
    const d = new Date();
    d.setSeconds(0, 0);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(h, min, 0, 0);
    return d;
  }

  function build() {
    return RAW.map(function (r) {
      const start = atOffset(r.dayOffset, r.h, r.min);
      const end = new Date(start.getTime() + r.dur * 60000);
      return Object.assign({}, r, { start: start, end: end });
    });
  }

  return {
    SKILLS: SKILLS,
    FORMATS: FORMATS,
    PERSONAS: PERSONAS,
    RECENT_COURTS: RECENT_COURTS,
    buildMatches: build,
    atOffset: atOffset
  };
})();
