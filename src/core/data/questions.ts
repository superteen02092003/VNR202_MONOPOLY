import type { Question, QuestionTopic } from '../types'

/**
 * NGÂN HÀNG CÂU HỎI VNR202 — Lịch sử Đảng Cộng sản Việt Nam.
 *
 * Bố cục theo 3 chương của học phần:
 *  - thanh-lap-dang : Đảng ra đời và lãnh đạo đấu tranh giành chính quyền (1930-1945)
 *  - khang-chien    : Đảng lãnh đạo hai cuộc kháng chiến (1945-1975)
 *  - doi-moi        : Cả nước quá độ lên CNXH và công cuộc Đổi mới (1975 đến nay)
 *
 * Bổ sung câu hỏi: chỉ cần thêm phần tử mới vào mảng, id không được trùng
 * (đã có test tự động kiểm tra tính hợp lệ của toàn bộ ngân hàng).
 */
export const QUESTIONS: Question[] = [
  /* ================================================================ */
  /* CHƯƠNG 1: ĐẢNG RA ĐỜI VÀ GIÀNH CHÍNH QUYỀN (1930 - 1945)         */
  /* ================================================================ */
  {
    id: 'c1-01',
    topic: 'thanh-lap-dang',
    difficulty: 'easy',
    prompt: 'Ngày nào được lấy làm ngày kỷ niệm thành lập Đảng Cộng sản Việt Nam?',
    options: ['3/2/1930', '6/1/1930', '19/5/1930', '2/9/1930'],
    answerIndex: 0,
    explanation:
      'Hội nghị hợp nhất các tổ chức cộng sản khai mạc ngày 6/1/1930. Đại hội III của Đảng (9/1960) quyết nghị lấy ngày 3/2 hằng năm làm ngày kỷ niệm thành lập Đảng.',
  },
  {
    id: 'c1-02',
    topic: 'thanh-lap-dang',
    difficulty: 'easy',
    prompt: 'Ai chủ trì Hội nghị hợp nhất thành lập Đảng Cộng sản Việt Nam đầu năm 1930?',
    options: ['Trần Phú', 'Nguyễn Ái Quốc', 'Lê Hồng Phong', 'Ngô Gia Tự'],
    answerIndex: 1,
    explanation:
      'Nguyễn Ái Quốc, với tư cách phái viên của Quốc tế Cộng sản, đã triệu tập và chủ trì Hội nghị hợp nhất ba tổ chức cộng sản.',
  },
  {
    id: 'c1-03',
    topic: 'thanh-lap-dang',
    difficulty: 'medium',
    prompt: 'Hội nghị thành lập Đảng Cộng sản Việt Nam diễn ra tại đâu?',
    options: ['Quảng Châu (Trung Quốc)', 'Ma Cao (Trung Quốc)', 'Pác Bó (Cao Bằng)', 'Hương Cảng (Trung Quốc)'],
    answerIndex: 3,
    explanation:
      'Hội nghị họp bí mật tại bán đảo Cửu Long, Hương Cảng (Hồng Kông), Trung Quốc.',
  },
  {
    id: 'c1-04',
    topic: 'thanh-lap-dang',
    difficulty: 'medium',
    prompt: 'Ba tổ chức cộng sản được hợp nhất thành Đảng Cộng sản Việt Nam là?',
    options: [
      'Đông Dương Cộng sản Đảng, An Nam Cộng sản Đảng, Đông Dương Cộng sản Liên đoàn',
      'Tân Việt Cách mạng Đảng, Việt Nam Quốc dân Đảng, Hội Việt Nam Cách mạng Thanh niên',
      'Đông Dương Cộng sản Đảng, Tân Việt Cách mạng Đảng, An Nam Cộng sản Đảng',
      'An Nam Cộng sản Đảng, Việt Nam Quang phục Hội, Đông Dương Cộng sản Liên đoàn',
    ],
    answerIndex: 0,
    explanation:
      'Năm 1929 lần lượt ra đời Đông Dương Cộng sản Đảng (6/1929), An Nam Cộng sản Đảng (8/1929) và Đông Dương Cộng sản Liên đoàn (9/1929).',
  },
  {
    id: 'c1-05',
    topic: 'thanh-lap-dang',
    difficulty: 'hard',
    prompt: 'Tổ chức cộng sản nào ra đời sớm nhất trong năm 1929?',
    options: ['An Nam Cộng sản Đảng', 'Đông Dương Cộng sản Liên đoàn', 'Đông Dương Cộng sản Đảng', 'Tân Việt Cách mạng Đảng'],
    answerIndex: 2,
    explanation: 'Đông Dương Cộng sản Đảng thành lập tháng 6/1929 tại Hà Nội.',
  },
  {
    id: 'c1-06',
    topic: 'thanh-lap-dang',
    difficulty: 'medium',
    prompt:
      'Nguyễn Ái Quốc đọc "Sơ thảo lần thứ nhất những luận cương về vấn đề dân tộc và vấn đề thuộc địa" của V.I. Lênin vào thời gian nào?',
    options: ['Tháng 7/1920', 'Tháng 12/1920', 'Tháng 6/1925', 'Năm 1927'],
    answerIndex: 0,
    explanation:
      'Tháng 7/1920, bản Sơ thảo Luận cương của Lênin đăng trên báo L\'Humanité đã giúp Nguyễn Ái Quốc tìm thấy con đường cứu nước: con đường cách mạng vô sản.',
  },
  {
    id: 'c1-07',
    topic: 'thanh-lap-dang',
    difficulty: 'hard',
    prompt: 'Nguyễn Ái Quốc tham gia sáng lập Đảng Cộng sản Pháp tại đại hội nào?',
    options: ['Đại hội Véc-xai (1919)', 'Đại hội Tua – Tours (12/1920)', 'Đại hội Quốc tế Cộng sản lần V (1924)', 'Đại hội Mác-xây (1921)'],
    answerIndex: 1,
    explanation:
      'Tại Đại hội Tua tháng 12/1920, Nguyễn Ái Quốc bỏ phiếu tán thành gia nhập Quốc tế Cộng sản và trở thành một trong những người sáng lập Đảng Cộng sản Pháp.',
  },
  {
    id: 'c1-08',
    topic: 'thanh-lap-dang',
    difficulty: 'medium',
    prompt: 'Hội Việt Nam Cách mạng Thanh niên được thành lập thời gian nào, ở đâu?',
    options: ['Tháng 6/1925 tại Quảng Châu', 'Tháng 12/1927 tại Hương Cảng', 'Tháng 6/1929 tại Hà Nội', 'Tháng 5/1941 tại Cao Bằng'],
    answerIndex: 0,
    explanation:
      'Tháng 6/1925, Nguyễn Ái Quốc thành lập Hội Việt Nam Cách mạng Thanh niên tại Quảng Châu (Trung Quốc) — tổ chức tiền thân của Đảng.',
  },
  {
    id: 'c1-09',
    topic: 'thanh-lap-dang',
    difficulty: 'medium',
    prompt: 'Tác phẩm "Đường Kách mệnh" của Nguyễn Ái Quốc được xuất bản năm nào?',
    options: ['1925', '1930', '1941', '1927'],
    answerIndex: 3,
    explanation:
      '"Đường Kách mệnh" (1927) tập hợp các bài giảng của Nguyễn Ái Quốc tại lớp huấn luyện chính trị ở Quảng Châu.',
  },
  {
    id: 'c1-10',
    topic: 'thanh-lap-dang',
    difficulty: 'medium',
    prompt: 'Tác phẩm "Bản án chế độ thực dân Pháp" được xuất bản lần đầu năm nào?',
    options: ['1919', '1922', '1925', '1927'],
    answerIndex: 2,
    explanation: '"Bản án chế độ thực dân Pháp" được xuất bản lần đầu tại Pa-ri năm 1925.',
  },
  {
    id: 'c1-11',
    topic: 'thanh-lap-dang',
    difficulty: 'medium',
    prompt: 'Cương lĩnh chính trị đầu tiên của Đảng (2/1930) do ai soạn thảo?',
    options: ['Nguyễn Ái Quốc', 'Trần Phú', 'Lê Duẩn', 'Trường Chinh'],
    answerIndex: 0,
    explanation:
      'Cương lĩnh chính trị đầu tiên gồm Chánh cương vắn tắt, Sách lược vắn tắt và Chương trình tóm tắt do Nguyễn Ái Quốc soạn thảo.',
  },
  {
    id: 'c1-12',
    topic: 'thanh-lap-dang',
    difficulty: 'medium',
    prompt: 'Luận cương chính trị tháng 10/1930 do ai soạn thảo?',
    options: ['Nguyễn Ái Quốc', 'Trần Phú', 'Hà Huy Tập', 'Nguyễn Văn Cừ'],
    answerIndex: 1,
    explanation:
      'Luận cương chính trị được Trần Phú soạn thảo và thông qua tại Hội nghị Ban Chấp hành Trung ương tháng 10/1930 ở Hương Cảng.',
  },
  {
    id: 'c1-13',
    topic: 'thanh-lap-dang',
    difficulty: 'medium',
    prompt: 'Tại Hội nghị Ban Chấp hành Trung ương tháng 10/1930, Đảng đổi tên thành gì?',
    options: ['Đảng Lao động Việt Nam', 'Đảng Cộng sản Đông Dương', 'Đông Dương Cộng sản Đảng', 'Đảng Dân chủ Việt Nam'],
    answerIndex: 1,
    explanation:
      'Hội nghị tháng 10/1930 quyết định đổi tên Đảng Cộng sản Việt Nam thành Đảng Cộng sản Đông Dương.',
  },
  {
    id: 'c1-14',
    topic: 'thanh-lap-dang',
    difficulty: 'easy',
    prompt: 'Ai là Tổng Bí thư đầu tiên của Đảng?',
    options: ['Nguyễn Ái Quốc', 'Lê Hồng Phong', 'Hà Huy Tập', 'Trần Phú'],
    answerIndex: 3,
    explanation: 'Trần Phú được bầu làm Tổng Bí thư đầu tiên tại Hội nghị Trung ương tháng 10/1930.',
  },
  {
    id: 'c1-15',
    topic: 'thanh-lap-dang',
    difficulty: 'easy',
    prompt: 'Đỉnh cao của phong trào cách mạng 1930 - 1931 là gì?',
    options: ['Khởi nghĩa Yên Bái', 'Xô viết Nghệ - Tĩnh', 'Khởi nghĩa Nam Kỳ', 'Cao trào kháng Nhật cứu nước'],
    answerIndex: 1,
    explanation:
      'Xô viết Nghệ - Tĩnh là đỉnh cao của cao trào 1930 - 1931, lần đầu tiên chính quyền của nhân dân được thiết lập ở một số vùng nông thôn.',
  },
  {
    id: 'c1-16',
    topic: 'thanh-lap-dang',
    difficulty: 'hard',
    prompt: 'Đại hội đại biểu toàn quốc lần thứ I của Đảng họp thời gian nào, tại đâu?',
    options: ['Tháng 3/1935 tại Ma Cao', 'Tháng 2/1951 tại Tuyên Quang', 'Tháng 10/1930 tại Hương Cảng', 'Tháng 5/1941 tại Cao Bằng'],
    answerIndex: 0,
    explanation: 'Đại hội I họp tháng 3/1935 tại Ma Cao (Trung Quốc), khôi phục hệ thống tổ chức của Đảng.',
  },
  {
    id: 'c1-17',
    topic: 'thanh-lap-dang',
    difficulty: 'medium',
    prompt: 'Hội nghị Trung ương lần thứ 6 (11/1939) có chủ trương nổi bật nào?',
    options: [
      'Đặt nhiệm vụ giải phóng dân tộc lên hàng đầu',
      'Đẩy mạnh cải cách ruộng đất',
      'Thành lập Mặt trận Dân chủ Đông Dương',
      'Phát động toàn quốc kháng chiến',
    ],
    answerIndex: 0,
    explanation:
      'Hội nghị Trung ương 6 (11/1939) đánh dấu bước chuyển hướng chỉ đạo chiến lược: đặt nhiệm vụ giải phóng dân tộc lên hàng đầu.',
  },
  {
    id: 'c1-18',
    topic: 'thanh-lap-dang',
    difficulty: 'medium',
    prompt: 'Hội nghị Trung ương lần thứ 8 (5/1941) họp ở đâu và do ai chủ trì?',
    options: [
      'Tân Trào (Tuyên Quang), Trường Chinh chủ trì',
      'Pác Bó (Cao Bằng), Nguyễn Ái Quốc chủ trì',
      'Hương Cảng (Trung Quốc), Trần Phú chủ trì',
      'Bà Điểm (Hóc Môn), Nguyễn Văn Cừ chủ trì',
    ],
    answerIndex: 1,
    explanation:
      'Hội nghị Trung ương 8 họp tháng 5/1941 tại Pác Bó (Cao Bằng) do Nguyễn Ái Quốc chủ trì, hoàn chỉnh chủ trương chuyển hướng chiến lược.',
  },
  {
    id: 'c1-19',
    topic: 'thanh-lap-dang',
    difficulty: 'medium',
    prompt: 'Mặt trận Việt Minh (Việt Nam Độc lập Đồng minh) được thành lập ngày nào?',
    options: ['19/5/1941', '22/12/1944', '23/11/1940', '16/8/1945'],
    answerIndex: 0,
    explanation: 'Theo quyết định của Hội nghị Trung ương 8, Mặt trận Việt Minh ra đời ngày 19/5/1941.',
  },
  {
    id: 'c1-20',
    topic: 'thanh-lap-dang',
    difficulty: 'easy',
    prompt: 'Đội Việt Nam Tuyên truyền Giải phóng quân được thành lập ngày nào?',
    options: ['19/8/1945', '22/12/1944', '19/5/1941', '2/9/1945'],
    answerIndex: 1,
    explanation:
      'Ngày 22/12/1944, Đội Việt Nam Tuyên truyền Giải phóng quân thành lập tại Cao Bằng, do đồng chí Võ Nguyên Giáp chỉ huy — tiền thân của Quân đội nhân dân Việt Nam.',
  },
  {
    id: 'c1-21',
    topic: 'thanh-lap-dang',
    difficulty: 'hard',
    prompt: 'Bản chỉ thị "Nhật – Pháp bắn nhau và hành động của chúng ta" ra đời ngày nào?',
    options: ['9/3/1945', '12/3/1945', '15/8/1945', '13/8/1945'],
    answerIndex: 1,
    explanation:
      'Ngày 12/3/1945, Ban Thường vụ Trung ương Đảng ra chỉ thị này, phát động cao trào kháng Nhật cứu nước làm tiền đề cho Tổng khởi nghĩa.',
  },
  {
    id: 'c1-22',
    topic: 'thanh-lap-dang',
    difficulty: 'medium',
    prompt: 'Khởi nghĩa giành chính quyền ở Hà Nội trong Cách mạng Tháng Tám diễn ra ngày nào?',
    options: ['16/8/1945', '19/8/1945', '23/8/1945', '25/8/1945'],
    answerIndex: 1,
    explanation:
      'Ngày 19/8/1945 khởi nghĩa thắng lợi ở Hà Nội; tiếp đó là Huế (23/8) và Sài Gòn (25/8).',
  },
  {
    id: 'c1-23',
    topic: 'thanh-lap-dang',
    difficulty: 'easy',
    prompt: 'Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập vào ngày nào, tại đâu?',
    options: [
      '19/8/1945 tại Nhà hát Lớn Hà Nội',
      '2/9/1945 tại Quảng trường Ba Đình',
      '6/1/1946 tại Bắc Bộ Phủ',
      '2/9/1945 tại Tân Trào',
    ],
    answerIndex: 1,
    explanation:
      'Ngày 2/9/1945, tại Quảng trường Ba Đình, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập, khai sinh nước Việt Nam Dân chủ Cộng hòa.',
  },
  {
    id: 'c1-24',
    topic: 'thanh-lap-dang',
    difficulty: 'hard',
    prompt: 'Khởi nghĩa Nam Kỳ nổ ra vào thời gian nào?',
    options: ['27/9/1940', '23/11/1940', '13/1/1941', '19/5/1941'],
    answerIndex: 1,
    explanation:
      'Khởi nghĩa Nam Kỳ nổ ra ngày 23/11/1940; lá cờ đỏ sao vàng lần đầu xuất hiện trong khởi nghĩa này.',
  },

  /* ================================================================ */
  /* CHƯƠNG 2: LÃNH ĐẠO HAI CUỘC KHÁNG CHIẾN (1945 - 1975)            */
  /* ================================================================ */
  {
    id: 'c2-01',
    topic: 'khang-chien',
    difficulty: 'medium',
    prompt: 'Chỉ thị "Kháng chiến kiến quốc" của Ban Thường vụ Trung ương Đảng ra đời ngày nào?',
    options: ['25/11/1945', '19/12/1946', '2/9/1945', '6/1/1946'],
    answerIndex: 0,
    explanation:
      'Chỉ thị "Kháng chiến kiến quốc" (25/11/1945) xác định kẻ thù chính là thực dân Pháp xâm lược và nhiệm vụ: củng cố chính quyền, chống thực dân Pháp, bài trừ nội phản, cải thiện đời sống nhân dân.',
  },
  {
    id: 'c2-02',
    topic: 'khang-chien',
    difficulty: 'medium',
    prompt: 'Cuộc Tổng tuyển cử đầu tiên bầu Quốc hội nước Việt Nam Dân chủ Cộng hòa diễn ra ngày nào?',
    options: ['2/9/1945', '6/1/1946', '19/12/1946', '25/11/1945'],
    answerIndex: 1,
    explanation: 'Ngày 6/1/1946, cuộc Tổng tuyển cử đầu tiên bầu Quốc hội khóa I được tổ chức trong cả nước.',
  },
  {
    id: 'c2-03',
    topic: 'khang-chien',
    difficulty: 'easy',
    prompt: 'Chủ tịch Hồ Chí Minh ra "Lời kêu gọi toàn quốc kháng chiến" vào ngày nào?',
    options: ['23/9/1945', '19/12/1946', '7/5/1954', '20/7/1954'],
    answerIndex: 1,
    explanation:
      'Đêm 19/12/1946, Chủ tịch Hồ Chí Minh ra "Lời kêu gọi toàn quốc kháng chiến", mở đầu cuộc kháng chiến chống thực dân Pháp trên phạm vi cả nước.',
  },
  {
    id: 'c2-04',
    topic: 'khang-chien',
    difficulty: 'medium',
    prompt: 'Tác phẩm "Kháng chiến nhất định thắng lợi" (1947) là của ai?',
    options: ['Hồ Chí Minh', 'Trường Chinh', 'Võ Nguyên Giáp', 'Lê Duẩn'],
    answerIndex: 1,
    explanation:
      'Tác phẩm của đồng chí Trường Chinh đã trình bày có hệ thống đường lối kháng chiến chống thực dân Pháp.',
  },
  {
    id: 'c2-05',
    topic: 'khang-chien',
    difficulty: 'medium',
    prompt: 'Đường lối kháng chiến chống thực dân Pháp của Đảng được khái quát là gì?',
    options: [
      'Toàn dân, toàn diện, lâu dài, dựa vào sức mình là chính',
      'Đánh nhanh, thắng nhanh, giải quyết nhanh',
      'Thần tốc, táo bạo, bất ngờ, chắc thắng',
      'Hai chân, ba mũi, ba vùng chiến lược',
    ],
    answerIndex: 0,
    explanation:
      'Đường lối kháng chiến: toàn dân, toàn diện, lâu dài, dựa vào sức mình là chính.',
  },
  {
    id: 'c2-06',
    topic: 'khang-chien',
    difficulty: 'hard',
    prompt: 'Đại hội đại biểu toàn quốc lần thứ II của Đảng (2/1951) họp tại đâu?',
    options: ['Tân Trào, Tuyên Quang', 'Chiêm Hóa, Tuyên Quang', 'Định Hóa, Thái Nguyên', 'Ma Cao, Trung Quốc'],
    answerIndex: 1,
    explanation: 'Đại hội II họp tháng 2/1951 tại xã Vinh Quang, huyện Chiêm Hóa, tỉnh Tuyên Quang.',
  },
  {
    id: 'c2-07',
    topic: 'khang-chien',
    difficulty: 'medium',
    prompt: 'Tại Đại hội II (2/1951), Đảng ra hoạt động công khai với tên gọi nào?',
    options: ['Đảng Cộng sản Đông Dương', 'Đảng Lao động Việt Nam', 'Đảng Cộng sản Việt Nam', 'Đảng Dân chủ Việt Nam'],
    answerIndex: 1,
    explanation:
      'Đại hội II quyết định đưa Đảng ra hoạt động công khai với tên gọi Đảng Lao động Việt Nam.',
  },
  {
    id: 'c2-08',
    topic: 'khang-chien',
    difficulty: 'medium',
    prompt: 'Chiến dịch nào năm 1950 đã khai thông biên giới Việt - Trung, giành thế chủ động trên chiến trường chính?',
    options: ['Chiến dịch Việt Bắc', 'Chiến dịch Hòa Bình', 'Chiến dịch Điện Biên Phủ', 'Chiến dịch Biên giới Thu - Đông'],
    answerIndex: 3,
    explanation:
      'Chiến dịch Biên giới Thu - Đông 1950 là chiến dịch tiến công lớn đầu tiên do ta chủ động mở, khai thông biên giới Việt - Trung.',
  },
  {
    id: 'c2-09',
    topic: 'khang-chien',
    difficulty: 'easy',
    prompt: 'Chiến dịch Điện Biên Phủ toàn thắng vào ngày nào?',
    options: ['7/5/1954', '21/7/1954', '13/3/1954', '30/4/1954'],
    answerIndex: 0,
    explanation:
      'Chiều 7/5/1954, lá cờ "Quyết chiến quyết thắng" tung bay trên nóc hầm De Castries, chiến dịch toàn thắng.',
  },
  {
    id: 'c2-10',
    topic: 'khang-chien',
    difficulty: 'hard',
    prompt: 'Phương châm tác chiến được thay đổi trong Chiến dịch Điện Biên Phủ là gì?',
    options: [
      'Từ "đánh chắc, tiến chắc" sang "đánh nhanh, thắng nhanh"',
      'Từ "đánh nhanh, thắng nhanh" sang "đánh chắc, tiến chắc"',
      'Từ "phòng ngự" sang "phản công"',
      'Từ "vây lấn" sang "tổng công kích"',
    ],
    answerIndex: 1,
    explanation:
      'Đại tướng Võ Nguyên Giáp quyết định thay đổi phương châm từ "đánh nhanh, thắng nhanh" sang "đánh chắc, tiến chắc" — quyết định khó khăn nhất trong cuộc đời cầm quân của ông.',
  },
  {
    id: 'c2-11',
    topic: 'khang-chien',
    difficulty: 'medium',
    prompt: 'Hiệp định Genève về đình chỉ chiến sự ở Việt Nam được ký ngày nào?',
    options: ['7/5/1954', '21/7/1954', '27/1/1973', '20/12/1960'],
    answerIndex: 1,
    explanation:
      'Hiệp định Genève ký ngày 21/7/1954, lấy vĩ tuyến 17 làm giới tuyến quân sự tạm thời.',
  },
  {
    id: 'c2-12',
    topic: 'khang-chien',
    difficulty: 'hard',
    prompt: 'Nghị quyết Hội nghị Trung ương lần thứ 15 (1/1959) xác định điều gì cho cách mạng miền Nam?',
    options: [
      'Chỉ đấu tranh chính trị hòa bình',
      'Khởi nghĩa giành chính quyền bằng lực lượng chính trị của quần chúng kết hợp với lực lượng vũ trang',
      'Tiến hành ngay tổng tiến công trên toàn miền Nam',
      'Tập trung xây dựng kinh tế miền Bắc',
    ],
    answerIndex: 1,
    explanation:
      'Nghị quyết 15 mở đường cho phong trào Đồng khởi, chuyển cách mạng miền Nam từ thế giữ gìn lực lượng sang thế tiến công.',
  },
  {
    id: 'c2-13',
    topic: 'khang-chien',
    difficulty: 'medium',
    prompt: 'Phong trào Đồng khởi (1/1960) nổ ra mạnh mẽ và tiêu biểu nhất ở tỉnh nào?',
    options: ['Bến Tre', 'Quảng Nam', 'Tây Ninh', 'Cà Mau'],
    answerIndex: 0,
    explanation:
      'Ngày 17/1/1960, Đồng khởi bùng nổ ở Mỏ Cày (Bến Tre) rồi lan rộng khắp Nam Bộ, Tây Nguyên và Trung Trung Bộ.',
  },
  {
    id: 'c2-14',
    topic: 'khang-chien',
    difficulty: 'hard',
    prompt: 'Mặt trận Dân tộc Giải phóng miền Nam Việt Nam ra đời ngày nào?',
    options: ['17/1/1960', '20/12/1960', '5/9/1960', '6/6/1969'],
    answerIndex: 1,
    explanation: 'Mặt trận Dân tộc Giải phóng miền Nam Việt Nam được thành lập ngày 20/12/1960.',
  },
  {
    id: 'c2-15',
    topic: 'khang-chien',
    difficulty: 'medium',
    prompt: 'Đại hội III của Đảng (9/1960) xác định đồng thời tiến hành mấy chiến lược cách mạng?',
    options: [
      'Một chiến lược: cách mạng xã hội chủ nghĩa trên cả nước',
      'Hai chiến lược: cách mạng XHCN ở miền Bắc và cách mạng dân tộc dân chủ nhân dân ở miền Nam',
      'Ba chiến lược tương ứng ba miền',
      'Hai chiến lược: kháng chiến và kiến quốc',
    ],
    answerIndex: 1,
    explanation:
      'Đại hội III xác định tiến hành đồng thời hai chiến lược cách mạng ở hai miền, cùng hướng tới mục tiêu chung là hòa bình thống nhất Tổ quốc.',
  },
  {
    id: 'c2-16',
    topic: 'khang-chien',
    difficulty: 'hard',
    prompt: 'Theo Đại hội III, cách mạng xã hội chủ nghĩa ở miền Bắc giữ vai trò gì?',
    options: [
      'Quyết định trực tiếp đối với sự nghiệp giải phóng miền Nam',
      'Quyết định nhất đối với sự phát triển của toàn bộ cách mạng Việt Nam',
      'Hỗ trợ về mặt ngoại giao',
      'Giữ vai trò hậu phương thuần túy',
    ],
    answerIndex: 1,
    explanation:
      'Miền Bắc giữ vai trò quyết định nhất đối với toàn bộ cách mạng Việt Nam; cách mạng miền Nam giữ vai trò quyết định trực tiếp đối với sự nghiệp giải phóng miền Nam.',
  },
  {
    id: 'c2-17',
    topic: 'khang-chien',
    difficulty: 'easy',
    prompt: 'Cuộc Tổng tiến công và nổi dậy Tết Mậu Thân diễn ra năm nào?',
    options: ['1965', '1968', '1972', '1975'],
    answerIndex: 1,
    explanation:
      'Tổng tiến công và nổi dậy Xuân Mậu Thân 1968 buộc Mỹ phải xuống thang chiến tranh và ngồi vào bàn đàm phán Pa-ri.',
  },
  {
    id: 'c2-18',
    topic: 'khang-chien',
    difficulty: 'medium',
    prompt: 'Chiến thắng "Hà Nội – Điện Biên Phủ trên không" diễn ra vào thời gian nào?',
    options: ['12 ngày đêm cuối tháng 12/1972', 'Tháng 5/1972', 'Tháng 1/1973', 'Tháng 4/1975'],
    answerIndex: 0,
    explanation:
      'Trong 12 ngày đêm cuối tháng 12/1972, quân dân ta đánh bại cuộc tập kích chiến lược bằng B-52 của Mỹ, buộc Mỹ phải ký Hiệp định Pa-ri.',
  },
  {
    id: 'c2-19',
    topic: 'khang-chien',
    difficulty: 'easy',
    prompt: 'Hiệp định Pa-ri về chấm dứt chiến tranh, lập lại hòa bình ở Việt Nam được ký ngày nào?',
    options: ['21/7/1954', '27/1/1973', '30/4/1975', '2/7/1976'],
    answerIndex: 1,
    explanation:
      'Hiệp định Pa-ri ký ngày 27/1/1973; Mỹ phải rút hết quân, công nhận độc lập, chủ quyền, thống nhất và toàn vẹn lãnh thổ của Việt Nam.',
  },
  {
    id: 'c2-20',
    topic: 'khang-chien',
    difficulty: 'hard',
    prompt: 'Chiến dịch nào mở màn cuộc Tổng tiến công và nổi dậy mùa Xuân 1975?',
    options: ['Chiến dịch Huế – Đà Nẵng', 'Chiến dịch Tây Nguyên', 'Chiến dịch Hồ Chí Minh', 'Chiến dịch Đường 9 – Nam Lào'],
    answerIndex: 1,
    explanation:
      'Chiến dịch Tây Nguyên mở màn, với trận then chốt Buôn Ma Thuột ngày 10/3/1975 tạo bước ngoặt chiến lược.',
  },
  {
    id: 'c2-21',
    topic: 'khang-chien',
    difficulty: 'medium',
    prompt: 'Chiến dịch giải phóng Sài Gòn – Gia Định được mang tên gì?',
    options: ['Chiến dịch Hồ Chí Minh', 'Chiến dịch Mậu Thân', 'Chiến dịch Trường Sơn', 'Chiến dịch Đồng Khởi'],
    answerIndex: 0,
    explanation:
      'Ngày 14/4/1975, Bộ Chính trị đồng ý đặt tên chiến dịch giải phóng Sài Gòn – Gia Định là Chiến dịch Hồ Chí Minh.',
  },
  {
    id: 'c2-22',
    topic: 'khang-chien',
    difficulty: 'easy',
    prompt: 'Miền Nam được hoàn toàn giải phóng vào ngày nào?',
    options: ['27/1/1973', '10/3/1975', '2/7/1976', '30/4/1975'],
    answerIndex: 3,
    explanation:
      'Ngày 30/4/1975, Chiến dịch Hồ Chí Minh toàn thắng, miền Nam hoàn toàn giải phóng, đất nước thống nhất.',
  },

  /* ================================================================ */
  /* CHƯƠNG 3: QUÁ ĐỘ LÊN CNXH VÀ CÔNG CUỘC ĐỔI MỚI (1975 - NAY)      */
  /* ================================================================ */
  {
    id: 'c3-01',
    topic: 'doi-moi',
    difficulty: 'medium',
    prompt: 'Quốc hội khóa VI (7/1976) quyết định đặt tên nước ta là gì?',
    options: [
      'Việt Nam Dân chủ Cộng hòa',
      'Cộng hòa xã hội chủ nghĩa Việt Nam',
      'Cộng hòa miền Nam Việt Nam',
      'Liên bang Đông Dương',
    ],
    answerIndex: 1,
    explanation:
      'Kỳ họp thứ nhất Quốc hội khóa VI (7/1976) đặt tên nước là Cộng hòa xã hội chủ nghĩa Việt Nam và đổi tên Sài Gòn – Gia Định thành Thành phố Hồ Chí Minh.',
  },
  {
    id: 'c3-02',
    topic: 'doi-moi',
    difficulty: 'medium',
    prompt: 'Tại Đại hội IV (12/1976), Đảng lấy lại tên gọi nào?',
    options: ['Đảng Lao động Việt Nam', 'Đảng Cộng sản Đông Dương', 'Đảng Nhân dân Cách mạng Việt Nam', 'Đảng Cộng sản Việt Nam'],
    answerIndex: 3,
    explanation:
      'Đại hội IV (12/1976) quyết định đổi tên Đảng Lao động Việt Nam thành Đảng Cộng sản Việt Nam.',
  },
  {
    id: 'c3-03',
    topic: 'doi-moi',
    difficulty: 'easy',
    prompt: 'Đại hội nào của Đảng khởi xướng đường lối Đổi mới toàn diện?',
    options: ['Đại hội V (3/1982)', 'Đại hội VI (12/1986)', 'Đại hội VII (6/1991)', 'Đại hội VIII (6/1996)'],
    answerIndex: 1,
    explanation:
      'Đại hội VI (12/1986) đề ra đường lối Đổi mới toàn diện, đánh dấu bước ngoặt trong sự nghiệp xây dựng CNXH ở nước ta.',
  },
  {
    id: 'c3-04',
    topic: 'doi-moi',
    difficulty: 'medium',
    prompt: 'Tổng Bí thư được bầu tại Đại hội VI (12/1986) là ai?',
    options: ['Lê Duẩn', 'Trường Chinh', 'Nguyễn Văn Linh', 'Đỗ Mười'],
    answerIndex: 2,
    explanation: 'Đồng chí Nguyễn Văn Linh được bầu làm Tổng Bí thư tại Đại hội VI.',
  },
  {
    id: 'c3-05',
    topic: 'doi-moi',
    difficulty: 'hard',
    prompt: 'Bài học kinh nghiệm hàng đầu mà Đại hội VI rút ra là gì?',
    options: [
      'Phải quán triệt tư tưởng "lấy dân làm gốc"',
      'Phải ưu tiên phát triển công nghiệp nặng',
      'Phải giữ vững cơ chế kế hoạch hóa tập trung',
      'Phải mở rộng quan hệ với tất cả các nước',
    ],
    answerIndex: 0,
    explanation:
      'Đại hội VI nêu bốn bài học lớn, trong đó bài học đầu tiên là: trong toàn bộ hoạt động của mình, Đảng phải quán triệt tư tưởng "lấy dân làm gốc".',
  },
  {
    id: 'c3-06',
    topic: 'doi-moi',
    difficulty: 'medium',
    prompt: 'Đổi mới phải toàn diện, đồng bộ nhưng trọng tâm là đổi mới lĩnh vực nào?',
    options: ['Chính trị', 'Văn hóa', 'Đối ngoại', 'Kinh tế'],
    answerIndex: 3,
    explanation:
      'Đảng xác định đổi mới toàn diện, đồng bộ, có bước đi phù hợp, trong đó trọng tâm là đổi mới kinh tế.',
  },
  {
    id: 'c3-07',
    topic: 'doi-moi',
    difficulty: 'medium',
    prompt: '"Cương lĩnh xây dựng đất nước trong thời kỳ quá độ lên chủ nghĩa xã hội" được thông qua tại đại hội nào?',
    options: ['Đại hội VI (12/1986)', 'Đại hội VII (6/1991)', 'Đại hội VIII (6/1996)', 'Đại hội IX (4/2001)'],
    answerIndex: 1,
    explanation: 'Cương lĩnh 1991 được thông qua tại Đại hội VII (6/1991).',
  },
  {
    id: 'c3-08',
    topic: 'doi-moi',
    difficulty: 'hard',
    prompt: 'Đại hội nào đã bổ sung, phát triển Cương lĩnh 1991?',
    options: ['Đại hội X (4/2006)', 'Đại hội XI (1/2011)', 'Đại hội XII (1/2016)', 'Đại hội XIII (1/2021)'],
    answerIndex: 1,
    explanation:
      'Đại hội XI (1/2011) thông qua Cương lĩnh xây dựng đất nước trong thời kỳ quá độ lên CNXH (bổ sung, phát triển năm 2011).',
  },
  {
    id: 'c3-09',
    topic: 'doi-moi',
    difficulty: 'medium',
    prompt: 'Đại hội VIII (6/1996) xác định nhiệm vụ trung tâm của thời kỳ mới là gì?',
    options: [
      'Đẩy mạnh công nghiệp hóa, hiện đại hóa đất nước',
      'Hoàn thành cải cách ruộng đất',
      'Xóa bỏ hoàn toàn kinh tế tư nhân',
      'Thực hiện kế hoạch hóa tập trung',
    ],
    answerIndex: 0,
    explanation:
      'Đại hội VIII xác định nước ta chuyển sang thời kỳ đẩy mạnh công nghiệp hóa, hiện đại hóa đất nước.',
  },
  {
    id: 'c3-10',
    topic: 'doi-moi',
    difficulty: 'medium',
    prompt: 'Mô hình kinh tế tổng quát của Việt Nam trong thời kỳ quá độ lên CNXH là gì?',
    options: [
      'Kinh tế kế hoạch hóa tập trung',
      'Kinh tế thị trường tự do',
      'Kinh tế thị trường định hướng xã hội chủ nghĩa',
      'Kinh tế hỗn hợp bao cấp',
    ],
    answerIndex: 2,
    explanation:
      'Đại hội IX (4/2001) chính thức xác định mô hình kinh tế tổng quát là kinh tế thị trường định hướng xã hội chủ nghĩa.',
  },
  {
    id: 'c3-11',
    topic: 'doi-moi',
    difficulty: 'hard',
    prompt: 'Đại hội X (4/2006) có chủ trương mới nào về đảng viên?',
    options: [
      'Cho phép đảng viên làm kinh tế tư nhân',
      'Cấm đảng viên tham gia kinh doanh',
      'Bắt buộc đảng viên phải làm việc trong khu vực nhà nước',
      'Giảm số lượng đảng viên trong doanh nghiệp',
    ],
    answerIndex: 0,
    explanation:
      'Đại hội X cho phép đảng viên làm kinh tế tư nhân, kể cả kinh tế tư bản tư nhân, nhưng phải tuân thủ pháp luật và Điều lệ Đảng.',
  },
  {
    id: 'c3-12',
    topic: 'doi-moi',
    difficulty: 'medium',
    prompt: 'Việt Nam gia nhập Hiệp hội các quốc gia Đông Nam Á (ASEAN) vào thời gian nào?',
    options: ['Tháng 7/1995', 'Tháng 11/1998', 'Tháng 1/2007', 'Tháng 12/1986'],
    answerIndex: 0,
    explanation: 'Ngày 28/7/1995, Việt Nam chính thức trở thành thành viên thứ bảy của ASEAN.',
  },
  {
    id: 'c3-13',
    topic: 'doi-moi',
    difficulty: 'medium',
    prompt: 'Việt Nam chính thức trở thành thành viên của Tổ chức Thương mại Thế giới (WTO) vào năm nào?',
    options: ['1995', '1998', '2015', '2007'],
    answerIndex: 3,
    explanation: 'Ngày 11/1/2007, Việt Nam chính thức là thành viên thứ 150 của WTO.',
  },
  {
    id: 'c3-14',
    topic: 'doi-moi',
    difficulty: 'medium',
    prompt: 'Đại hội XIII (1/2021) đặt mục tiêu đến năm 2045 Việt Nam trở thành nước như thế nào?',
    options: [
      'Nước đang phát triển, thu nhập trung bình thấp',
      'Nước công nghiệp mới',
      'Nước phát triển, thu nhập cao',
      'Nước nông nghiệp hiện đại',
    ],
    answerIndex: 2,
    explanation:
      'Đại hội XIII đặt mục tiêu đến năm 2045, kỷ niệm 100 năm thành lập nước, Việt Nam trở thành nước phát triển, thu nhập cao.',
  },
  {
    id: 'c3-15',
    topic: 'doi-moi',
    difficulty: 'hard',
    prompt: 'Đại hội XIII đặt mục tiêu đến năm 2030 (kỷ niệm 100 năm thành lập Đảng) Việt Nam là nước như thế nào?',
    options: [
      'Nước đang phát triển, có công nghiệp hiện đại, thu nhập trung bình cao',
      'Nước phát triển, thu nhập cao',
      'Nước công nghiệp hóa hoàn toàn',
      'Nước có nền nông nghiệp tiên tiến',
    ],
    answerIndex: 0,
    explanation:
      'Mục tiêu đến năm 2030: là nước đang phát triển, có công nghiệp hiện đại, thu nhập trung bình cao.',
  },
  {
    id: 'c3-16',
    topic: 'doi-moi',
    difficulty: 'hard',
    prompt: 'Đảng xác định con đường đi lên chủ nghĩa xã hội ở Việt Nam là gì?',
    options: [
      'Quá độ trực tiếp từ chủ nghĩa tư bản phát triển',
      'Quá độ lên CNXH bỏ qua chế độ tư bản chủ nghĩa',
      'Phát triển tuần tự qua giai đoạn tư bản chủ nghĩa',
      'Giữ nguyên nền kinh tế tự cấp tự túc',
    ],
    answerIndex: 1,
    explanation:
      'Việt Nam quá độ lên CNXH bỏ qua chế độ tư bản chủ nghĩa, tức bỏ qua việc xác lập vị trí thống trị của quan hệ sản xuất và kiến trúc thượng tầng tư bản chủ nghĩa, nhưng tiếp thu thành tựu nhân loại đã đạt được.',
  },
]

export const QUESTIONS_BY_TOPIC: Record<QuestionTopic, Question[]> = {
  'thanh-lap-dang': QUESTIONS.filter((q) => q.topic === 'thanh-lap-dang'),
  'khang-chien': QUESTIONS.filter((q) => q.topic === 'khang-chien'),
  'doi-moi': QUESTIONS.filter((q) => q.topic === 'doi-moi'),
}

export const TOPIC_LABEL: Record<QuestionTopic, string> = {
  'thanh-lap-dang': 'Chương 1 — Đảng ra đời và giành chính quyền (1930-1945)',
  'khang-chien': 'Chương 2 — Lãnh đạo hai cuộc kháng chiến (1945-1975)',
  'doi-moi': 'Chương 3 — Quá độ lên CNXH và Đổi mới (1975 - nay)',
}

export const DIFFICULTY_LABEL = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
} as const
