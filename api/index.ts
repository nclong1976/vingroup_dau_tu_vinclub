import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase Admin
admin.initializeApp({
  projectId: firebaseConfig.projectId,
});

const dbAdmin = getFirestore(firebaseConfig.firestoreDatabaseId);

// Hardcoded Vingroup Premium Investment Portfolios
const LOCATIONS = [
  "Vinhomes Riverside, Hà Nội",
  "Vinhomes Grand Park, TP.HCM",
  "Vinhomes Ocean Park, Gia Lâm",
  "Vinhomes Golden River, Ba Son",
  "Vincom Center Đồng Khởi",
  "Vincom Mega Mall Royal City",
  "Vincom Plaza Đà Nẵng",
  "VinOffice Tower Hà Nội",
  "Biệt thự Vinhomes Central Park",
  "Nhà ở xã hội Happy Town",
  "Vinpearl Resort Nha Trang",
  "Vinpearl Luxury Đà Nẵng",
  "Vinpearl Golf Nam Hội An",
  "VinOasis Phú Quốc",
  "Vinpearl Safari Phú Quốc",
  "VinWonders Nha Trang",
  "Vinpearl Golf Hải Phòng",
  "Hệ thống Vinschool Times City",
  "Đại học Tinh hoa VinUni",
  "Bệnh viện Vinmec Times City",
  "Bệnh viện Vinmec Central Park",
  "Chuỗi bán lẻ dược phẩm VinFA",
  "Tập đoàn xe điện toàn cầu VinFast",
  "Nhà máy Ô tô VinFast Hải Phòng",
  "Xe buýt điện thông minh VinBus",
  "Điện thoại thông minh Vsmart",
  "Siêu thị WinMart Times City",
  "Cửa hàng WinMart+",
  "Thương mại điện tử Adayroi",
  "Chuỗi điện máy VinPro",
  "Bán lẻ thời trang VinDS",
  "Hệ thống Viễn Thông A",
  "Viện Trí tuệ Nhân tạo VinAI",
  "Nghiên cứu dữ liệu lớn VinBigData",
  "Hệ thống an ninh mạng VinCSS",
  "Phát triển phần mềm HMS",
  "Nghiên cứu nguyên vật liệu VinTech",
  "Dịch vụ công nghệ VinConnect",
  "Số hóa doanh nghiệp VinDiGix",
  "Hãng hàng không Vinpearl Air",
  "Trường đào tạo phi công VinAviation",
  "Xưởng phim hoạt hình VinTaTa",
  "Hỗ trợ khởi nghiệp VinVentures",
  "Chăm sóc sức khỏe VinCharm",
  "Bán lẻ ngành trẻ em VinKC",
  "Đại lý công nghệ One Mount Group",
  "Cổng thanh toán & Ví VinID",
  "Quỹ Vì Tương Lai Xanh"
];

// Curated Unsplash photo IDs for professional-grade investment visual cards
const UNSPLASH_IDS: Record<string, string> = {
  "Vinhomes Riverside, Hà Nội": "photo-1600585154340-be6161a56a0c",
  "Vinhomes Grand Park, TP.HCM": "photo-1545324418-cc1a3fa10c00",
  "Vinhomes Ocean Park, Gia Lâm": "photo-1512917774080-9991f1c4c750",
  "Vinhomes Golden River, Ba Son": "photo-1486406146926-c627a92ad1ab",
  "Vincom Center Đồng Khởi": "photo-1568254183919-78a4f43a2877",
  "Vincom Mega Mall Royal City": "photo-1519501025264-65ba15a82390",
  "Vincom Plaza Đà Nẵng": "photo-1555529669-e69e7aa0ba9a",
  "VinOffice Tower Hà Nội": "photo-1497366216548-37526070297c",
  "Biệt thự Vinhomes Central Park": "photo-1600596542815-ffad4c1539a9",
  "Nhà ở xã hội Happy Town": "photo-1582407947304-fd86f028f716",
  "Vinpearl Resort Nha Trang": "photo-1571896349842-33c89424de2d",
  "Vinpearl Luxury Đà Nẵng": "photo-1540541338287-41700207dee6",
  "Vinpearl Golf Nam Hội An": "photo-1587174486073-ae5e5cff23aa",
  "VinOasis Phú Quốc": "photo-1542314831-068cd1dbfeeb",
  "Vinpearl Safari Phú Quốc": "photo-1534447677768-be436bb09401",
  "VinWonders Nha Trang": "photo-1505995433366-e12047f3f144",
  "Vinpearl Golf Hải Phòng": "photo-1535131749006-b7f58c99034b",
  "Hệ thống Vinschool Times City": "photo-1577896851231-70ef18881754",
  "Đại học Tinh hoa VinUni": "photo-1592280771190-3e2e4d571952",
  "Bệnh viện Vinmec Times City": "photo-1584515979956-d9f6e5d09982",
  "Bệnh viện Vinmec Central Park": "photo-1519494026892-80bbd2d6fd0d",
  "Chuỗi bán lẻ dược phẩm VinFA": "photo-1586015555751-63bb77f4322a",
  "Tập đoàn xe điện toàn cầu VinFast": "photo-1617788138017-80ad40651399",
  "Nhà máy Ô tô VinFast Hải Phòng": "photo-1581091226825-a6a2a5aee158",
  "Xe buýt điện thông minh VinBus": "photo-1570125909232-eb263c188f7e",
  "Điện thoại thông minh Vsmart": "photo-1511707171634-5f897ff02aa9",
  "Siêu thị WinMart Times City": "photo-1542838132-92c53300491e",
  "Cửa hàng WinMart+": "photo-1604719312566-8912e9227c6a",
  "Thương mại điện tử Adayroi": "photo-1460925895917-afdab827c52f",
  "Chuỗi điện máy VinPro": "photo-1518770660439-4636190af475",
  "Bán lẻ thời trang VinDS": "photo-1483985988355-763728e1935b",
  "Hệ thống Viễn Thông A": "photo-1511707171634-5f897ff02aa9",
  "Viện Trí tuệ Nhân tạo VinAI": "photo-1526374965328-7f61d4dc18c5",
  "Nghiên cứu dữ liệu lớn VinBigData": "photo-1507146426996-ef05306b995a",
  "Hệ thống an ninh mạng VinCSS": "photo-1563986768609-322da13575f3",
  "Phát triển phần mềm HMS": "photo-1555066931-4365d14bab8c",
  "Nghiên cứu nguyên vật liệu VinTech": "photo-1532187643603-ba119ca4109e",
  "Dịch vụ công nghệ VinConnect": "photo-1515378791036-0648a3ef77b2",
  "Số hóa doanh nghiệp VinDiGix": "photo-1451187580459-43490279c0fa",
  "Hãng hàng không Vinpearl Air": "photo-1436491865332-7a61a109cc05",
  "Trường đào tạo phi công VinAviation": "photo-1517976487492-5750f3195933",
  "Xưởng phim hoạt hình VinTaTa": "photo-1534447677768-be436bb09401",
  "Hỗ trợ khởi nghiệp VinVentures": "photo-1559136555-9303baea8ebd",
  "Chăm sóc sức khỏe VinCharm": "photo-1519699047748-de8e457a634e",
  "Bán lẻ ngành trẻ em VinKC": "photo-1513159446162-54eb8bdaa79b",
  "Đại lý công nghệ One Mount Group": "photo-1552664730-d307ca884978",
  "Cổng thanh toán & Ví VinID": "photo-1559526324-4b87b5e36e44",
  "Quỹ Vì Tương Lai Xanh": "photo-1542601906990-b4d3fb778b09"
};

// Beautiful premium Vietnamese descriptions for Vingroup assets
const locationDescriptions: Record<string, string> = {
  "Vinhomes Riverside, Hà Nội": "Khu đô thị sinh thái đẳng cấp bậc nhất Thủ đô mang phong cách lãng mạn Venice. Quy tụ cộng đồng cư dân tinh hoa với hàng trăm biệt thự vườn sang trọng, bao quanh bởi hệ thống kênh đào trong lành dài 18.6km và thảm xanh rộng lớn, biểu tượng của sự phồn vinh và cuộc sống thượng lưu chuẩn mực.",
  "Vinhomes Grand Park, TP.HCM": "Đại đô thị thông minh chuẩn mực quốc tế tọa lạc tại trung tâm phía Đông Sài Gòn. Tích hợp công viên 36ha quy mô hàng đầu Đông Nam Á, hệ thống vận hành thông minh và cộng đồng cư dân đa quốc gia năng động, mang lại tiềm năng gia tăng giá trị đầu tư vượt trội.",
  "Vinhomes Ocean Park, Gia Lâm": "Thành phố Biển hồ - kỳ quan đô thị có một không hai tại phía Đông Hà Nội. Sở hữu bộ đôi biển hồ nước mặn 6.1ha và hồ Ngọc Trai cát trắng 24.5ha, kiến tạo trải nghiệm sống nghỉ dưỡng giữa lòng phố thị sầm uất cho cư dân toàn cầu.",
  "Vinhomes Golden River, Ba Son": "Dự án căn hộ và biệt thự siêu cao cấp sở hữu vị thế độc tôn bên bờ sông Sài Gòn ngay trung tâm Quận 1. Được kiến tạo trên mảnh đất Ba Son lịch sử, dự án mang thiết kế kính chạm sàn Low-E hiện đại và nội thất xa hoa từ các thương hiệu hàng đầu thế giới.",
  "Vincom Center Đồng Khởi": "Tòa tháp biểu tượng trung tâm tài chính và thương mại Sài Gòn, điểm đến mua sắm và giải trí thời thượng của tầng lớp tinh hoa, với thiết kế xanh tiết kiệm năng lượng đạt chuẩn quốc tế.",
  "Vincom Mega Mall Royal City": "Quần thể trung tâm thương mại ngầm lớn nhất Đông Nam Á, mang phong cách kiến trúc hoàng gia châu Âu tinh tế. Điểm nhấn là khu vui chơi giải trí khép kín, rạp chiếu phim hiện đại và hàng trăm gian hàng ẩm thực quốc tế đỉnh cao.",
  "Vincom Plaza Đà Nẵng": "Điểm hẹn mua sắm, ẩm thực và trải nghiệm giải trí đẳng cấp bên bờ sông Hàn thơ mộng, đóng vai trò là động lực kinh tế thương mại quan trọng của thành phố đáng sống nhất Việt Nam.",
  "VinOffice Tower Hà Nội": "Chuỗi tháp văn phòng hạng A cao cấp sở hữu chứng chỉ xanh quốc tế. Không gian làm việc thông minh tích hợp công nghệ quản lý hiện đại mang lại hiệu quả tối đa cho các tập đoàn đa quốc gia và tổ chức tài chính hàng đầu.",
  "Biệt thự Vinhomes Central Park": "Khu biệt thự The Villas sang trọng biệt lập tọa lạc ven sông Sài Gòn ngay trung tâm thành phố. Kiến trúc tân cổ điển quý phái hài hòa cùng công viên Central Park 14ha, mang lại không gian sống xa hoa bậc nhất Việt Nam.",
  "Nhà ở xã hội Happy Town": "Dòng sản phẩm nhà ở văn minh, hiện đại dành riêng cho người lao động thu nhập thấp. Được tối ưu hóa thiết kế và tiện ích đồng bộ, mang lại giải pháp an cư lạc nghiệp chất lượng, ấm áp và nhân văn vượt trội.",
  "Vinpearl Resort Nha Trang": "Thiên đường nghỉ dưỡng 5 sao nằm biệt lập trên đảo Hòn Tre thơ mộng với bãi biển cát trắng tự nhiên dài hàng cây số. Biểu tượng của lối sống tinh hoa, thư giãn tuyệt đối và các dịch vụ spa, ẩm thực đẳng cấp toàn cầu.",
  "Vinpearl Luxury Đà Nẵng": "Khu biệt thự nghỉ dưỡng cao cấp tọa lạc bên bờ biển Non Nước quyến rũ dưới chân Ngũ Hành Sơn. Mang thiết kế Đông Dương cổ điển sang trọng kết hợp hồ bơi vô cực rộng lớn sát biển đầy ấn tượng.",
  "Vinpearl Golf Nam Hội An": "Sân golf 18 hố tiêu chuẩn Championship quốc tế độc đáo giữa những cồn cát tự nhiên tuyệt đẹp. Điểm đến thể thao thượng lưu kết hợp nghỉ dưỡng sinh thái chuẩn mực hàng đầu miền Trung.",
  "VinOasis Phú Quốc": "Tổ hợp khách sạn và trung tâm hội nghị quốc tế cao cấp kết hợp công viên nước riêng biệt trên đảo ngọc Phú Quốc, mang lại kỳ nghỉ đa trải nghiệm tràn ngập năng lượng tươi trẻ.",
  "Vinpearl Safari Phú Quốc": "Công viên chăm sóc và bảo tồn động vật bán hoang dã lớn nhất Việt Nam, được quy hoạch theo chuẩn quốc tế nhằm bảo tồn đa dạng sinh học và đem lại những hành trình khám phá thiên nhiên hoang dã kỳ thú.",
  "VinWonders Nha Trang": "Công viên giải trí của những kỷ lục toàn cầu, mang quy mô thế giới tọa lạc trên vịnh biển đẹp nhất hành tinh, với hàng trăm trò chơi mạo hiểm đỉnh cao và các chương trình biểu diễn nghệ thuật đa phương tiện hoành tráng.",
  "Vinpearl Golf Hải Phòng": "Kiệt tác sân golf 36 hố đẳng cấp tọa lạc trên đảo Vũ Yên xinh đẹp. Thiết kế độc đáo của sân đầm lầy kết hợp cùng nhà câu lạc bộ hiện đại mang lại thử thách hấp dẫn cho giới thượng lưu miền Bắc.",
  "Hệ thống Vinschool Times City": "Hệ thống giáo dục Việt Nam mang đẳng cấp quốc tế liên cấp từ mầm non đến trung học phổ thông. Chương trình học tiên tiến chuẩn Cambridge giúp trang bị đầy đủ kiến thức, kỹ năng và phẩm chất toàn cầu cho thế hệ trẻ.",
  "Đại học Tinh hoa VinUni": "Trường đại học tư thục phi lợi nhuận phát triển theo chuẩn mực quốc tế của giới tinh hoa. Hợp tác chiến lược cùng hai đại học Ivy League hàng đầu Hoa Kỳ (Cornell và Pennsylvania) nhằm đào tạo các nhà lãnh đạo tương lai xuất sắc.",
  "Bệnh viện Vinmec Times City": "Bệnh viện đa khoa quốc tế đạt chứng chỉ JCI uy tín toàn cầu. Quy tụ đội ngũ chuyên gia y khoa đầu ngành cùng hệ thống trang thiết bị chẩn đoán, điều trị tối tân, bảo vệ sức khỏe toàn diện cho thượng khách.",
  "Bệnh viện Vinmec Central Park": "Bệnh viện đa khoa chuẩn quốc tế hàng đầu tại TP.HCM với thế mạnh vượt trội về can thiệp tim mạch chất lượng cao, mang lại dịch vụ chăm sóc y tế chuẩn khách sạn 5 sao sang trọng.",
  "Chuỗi bán lẻ dược phẩm VinFA": "Hệ thống bán lẻ dược phẩm chuẩn mực quốc tế tiên phong, cung cấp nguồn thuốc chất lượng, có xuất xứ rõ ràng kết hợp cùng dịch vụ tư vấn chăm sóc sức khỏe tận tâm từ các dược sĩ chuyên môn cao.",
  "Tập đoàn xe điện toàn cầu VinFast": "Biểu tượng cho khát vọng công nghiệp toàn cầu của Việt Nam. VinFast dẫn đầu kỷ nguyên di chuyển xanh với hệ sinh thái xe điện thông minh đột phá từ xe máy, ô tô SUV sang trọng đến xe buýt điện toàn cầu.",
  "Nhà máy Ô tô VinFast Hải Phòng": "Khu phức hợp sản xuất công nghiệp 4.0 quy mô hàng đầu khu vực với tỷ lệ tự động hóa lên đến 90%. Nơi xuất xưởng những mẫu xe điện thông minh mang tiêu chuẩn an toàn tối cao thế giới.",
  "Xe buýt điện thông minh VinBus": "Mô hình vận tải hành khách công cộng xanh tiên phong tại Việt Nam. Sử dụng năng lượng điện 100%, tích hợp công nghệ AI kiểm soát hành trình an toàn và chất lượng phục vụ thân thiện vượt trội.",
  "Điện thoại thông minh Vsmart": "Thương hiệu điện thoại thông minh thuần Việt từng nắm giữ thị phần lớn thứ 3 Việt Nam, ghi dấu ấn đột phá về thiết kế, phần cứng ưu việt và phần mềm tối ưu cho người Việt.",
  "Siêu thị WinMart Times City": "Chuỗi siêu thị bán lẻ lớn hàng đầu Việt Nam mang phong cách mua sắm văn minh, hiện đại. Cung cấp nguồn thực phẩm sạch, tươi ngon đặc quyền và hàng tiêu dùng phong phú cho hàng triệu gia đình Việt.",
  "Cửa hàng WinMart+": "Mô hình cửa hàng tiện ích phủ rộng khắp mọi nẻo đường, cung cấp nhu yếu phẩm thiết yếu nhanh chóng, thân thiện và chất lượng, mang lại giải pháp mua sắm tiện nghi tối đa hàng ngày.",
  "Thương mại điện tử Adayroi": "Nền tảng mua sắm trực tuyến tiên phong của Vingroup mang sứ mệnh số hóa thị trường tiêu dùng Việt, kết nối các dịch vụ sinh thái đa dạng từ nghỉ dưỡng, ẩm thực đến thời trang tiện ích.",
  "Chuỗi điện máy VinPro": "Trung tâm bán lẻ công nghệ và điện máy hiện đại, trưng bày hàng nghìn sản phẩm điện tử, điện gia dụng chính hãng chuẩn quốc tế, mang lại trải nghiệm tiện nghi ưu việt cho gia đình.",
  "Bán lẻ thời trang VinDS": "Hệ thống chuỗi bán lẻ chuyên biệt về thời trang, mỹ phẩm và thể thao cao cấp, mang lại những thương hiệu quốc tế thời thượng đón đầu các xu hướng thẩm mỹ đẳng cấp toàn cầu.",
  "Hệ thống Viễn Thông A": "Chuỗi bán lẻ thiết bị di động lâu đời hàng đầu Việt Nam được Vingroup mua lại nhằm tối ưu hóa kênh phân phối công nghệ thông minh, mang lại dịch vụ bảo hành và chăm sóc khách hàng uy tín vượt trội.",
  "Viện Trí tuệ Nhân tạo VinAI": "Viện nghiên cứu AI thuộc top 20 thế giới về công nghệ trí tuệ nhân tạo. Nơi hội tụ các nhà khoa học xuất sắc toàn cầu nhằm phát triển các giải pháp AI tự hành thế hệ mới đột phá.",
  "Nghiên cứu dữ liệu lớn VinBigData": "Đơn vị tiên phong phát triển các công nghệ lõi dựa trên Dữ liệu lớn (Big Data) và Trí tuệ nhân tạo, nổi bật với trợ lý giọng nói thông minh ViVi trên dòng xe ô tô VinFast toàn cầu.",
  "Hệ thống an ninh mạng VinCSS": "Đơn vị an ninh mạng uy tín quốc tế, dẫn đầu trong lĩnh vực xác thực không mật khẩu đạt chuẩn FIDO2 toàn cầu, bảo mật tối cao cho các hạ tầng số trọng yếu của quốc gia.",
  "Phát triển phần mềm HMS": "Doanh nghiệp cung cấp các giải pháp phần mềm quản trị doanh nghiệp chuyên sâu và chuyển đổi số hạ tầng dịch vụ quy mô lớn, kiến tạo hệ điều hành vận hành thông minh và tối ưu.",
  "Nghiên cứu nguyên vật liệu VinTech": "Đơn vị nghiên cứu khoa học công nghệ chuyên sâu, tập trung vào công nghệ phần mềm, trí tuệ nhân tạo và nghiên cứu chế tạo các nguyên vật liệu mới siêu bền ứng dụng công nghiệp tương lai.",
  "Dịch vụ công nghệ VinConnect": "Doanh nghiệp cung cấp hạ tầng viễn thông số và dịch vụ truyền dẫn dữ liệu tốc độ cao chuyên nghiệp, tạo nên huyết mạch kết nối thông suốt cho toàn bộ hệ sinh thái dịch vụ Vingroup.",
  "Số hóa doanh nghiệp VinDiGix": "Đơn vị cung cấp các giải pháp đám mây, tích hợp hệ thống số và tự động hóa quy trình nghiệp vụ chuyên nghiệp cho các tập đoàn lớn phát triển thịnh vượng.",
  "Hãng hàng không Vinpearl Air": "Dự án hãng hàng không dân dụng cao cấp mang khát vọng chắp cánh cho du lịch Việt Nam vươn xa toàn cầu, kết nối các thiên đường du lịch nghỉ dưỡng Vinpearl đến các thủ đô văn hóa thế giới.",
  "Trường đào tạo phi công VinAviation": "Trường đào tạo phi công và kỹ thuật viên hàng không đạt chuẩn quốc tế, trang bị các thiết bị giả lập mô phỏng hiện đại bậc nhất nhằm huấn luyện đội ngũ bay an toàn tuyệt đối.",
  "Xưởng phim hoạt hình VinTaTa": "Xưởng sản xuất phim hoạt hình 3D kỹ thuật số đẳng cấp quốc tế, sở hữu chuỗi nhân vật nguyên bản đầy sống động nhằm nuôi dưỡng ước mơ bay bổng và các giá trị văn hóa nhân văn cho trẻ thơ.",
  "Hỗ trợ khởi nghiệp VinVentures": "Quỹ hỗ trợ và đầu tư mạo hiểm dành cho các dự án khởi nghiệp công nghệ sáng tạo đột phá, đồng hành và thúc đẩy các tài năng Việt vươn tầm thế giới.",
  "Chăm sóc sức khỏe VinCharm": "Chuỗi trung tâm spa trị liệu và chăm sóc sức khỏe, sắc đẹp cao cấp chuẩn resort 5 sao, mang lại những liệu trình thư giãn tái tạo năng lượng hoàn hảo cho giới thượng lưu.",
  "Bán lẻ ngành trẻ em VinKC": "Hệ thống trung tâm bán lẻ và dịch vụ chuyên biệt dành riêng cho mẹ và bé cao cấp, mang lại những sản phẩm chăm sóc, đồ chơi giáo dục an toàn tuyệt đối theo tiêu chuẩn quốc tế.",
  "Đại lý công nghệ One Mount Group": "Hệ sinh thái số liên kết đại lý lớn nhất Việt Nam với các nền tảng VinShop, VinID và OneHousing, tạo ra chuỗi giá trị bán lẻ và bất động sản hiện đại, liền mạch từ nhà sản xuất đến người dùng cuối.",
  "Cổng thanh toán & Ví VinID": "Hệ sinh thái số đa năng tích hợp thanh toán điện tử, tích điểm thành viên VinClub và ưu đãi đặc quyền, mang lại giải pháp thanh toán không chạm tiện ích, an toàn tuyệt đối hàng ngày.",
  "Quỹ Vì Tương Lai Xanh": "Tổ chức phi lợi nhuận tiên phong kiến tạo các dự án hành động thiết thực vì mục tiêu phát triển xanh bền vững. Thực hiện các chương trình chuyển đổi xanh, bảo vệ môi trường sinh thái quốc gia toàn diện."
};

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Memory cache to avoid spamming Unsplash and make it ultra-fast!
const base64Cache: Record<string, string> = {};

const generateFallbackSvgBase64 = (locationName: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="533" viewBox="0 0 400 533">
    <rect width="400" height="533" fill="#090a0f"/>
    <!-- Luxury borders -->
    <rect x="8" y="8" width="384" height="517" fill="none" stroke="#d4af37" stroke-width="4" opacity="0.8"/>
    <rect x="16" y="16" width="368" height="501" fill="none" stroke="#d4af37" stroke-width="1" opacity="0.3"/>
    
    <!-- Abstract premium geometric patterns -->
    <g transform="translate(200, 220)">
      <circle cx="0" cy="0" r="90" fill="none" stroke="#d4af37" stroke-width="1.5" opacity="0.15"/>
      <circle cx="0" cy="0" r="110" fill="none" stroke="#d4af37" stroke-width="1" stroke-dasharray="4,4" opacity="0.2"/>
      <circle cx="0" cy="0" r="60" fill="none" stroke="#d4af37" stroke-width="2" opacity="0.1"/>
      <polygon points="0,-70 50,20 -50,20" fill="none" stroke="#d4af37" stroke-width="1.5" opacity="0.2"/>
      <polygon points="0,70 50,-20 -50,-20" fill="none" stroke="#d4af37" stroke-width="1" opacity="0.1"/>
    </g>

    <!-- Glowing accent gradient placeholder -->
    <circle cx="200" cy="220" r="40" fill="#d4af37" opacity="0.05"/>

    <!-- Gold foil seal -->
    <circle cx="200" cy="220" r="25" fill="none" stroke="#d4af37" stroke-width="2" opacity="0.6"/>
    <text x="200" y="223" fill="#d4af37" font-family="sans-serif" font-size="8" font-weight="bold" text-anchor="middle" letter-spacing="1">VIP</text>

    <!-- Elegant Labeling -->
    <rect x="40" y="380" width="320" height="1" fill="#d4af37" opacity="0.3"/>
    <text x="200" y="415" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" letter-spacing="2">${locationName.toUpperCase()}</text>
    <text x="200" y="440" fill="#d4af37" font-family="monospace" font-size="9" text-anchor="middle" letter-spacing="1.5" opacity="0.8">HỆ SINH THÁI VINCLUB VIP</text>
    <rect x="120" y="455" width="160" height="1" fill="#d4af37" opacity="0.2"/>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

async function getBase64Image(locationName: string, unsplashId: string): Promise<string> {
  const cacheKey = unsplashId;
  if (base64Cache[cacheKey]) {
    return base64Cache[cacheKey];
  }

  const imageUrl = `https://images.unsplash.com/${unsplashId}?auto=format&fit=crop&w=400&h=533&q=80`;
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Unsplash returned status ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = response.headers.get("content-type") || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    base64Cache[cacheKey] = dataUrl;
    return dataUrl;
  } catch (error) {
    console.warn(`Failed to fetch Unsplash image for ${locationName}, using gorgeous SVG fallback:`, error);
    return generateFallbackSvgBase64(locationName);
  }
}

const app = express();
app.use(express.json({ limit: '50mb' }));

// API endpoint - Optimized to load locations instantly with zero Gemini API hit, preventing 429
app.post("/api/generate-location", async (req, res) => {
  try {
    const { index } = req.body;
    const location = LOCATIONS[index % LOCATIONS.length];
    
    const unsplashId = UNSPLASH_IDS[location] || "photo-1507525428034-b723cf961d3e";
    const base64Data = await getBase64Image(location, unsplashId);
    
    // Load info from locationInfo.json immediately
    let rawInfo = locationDescriptions[location] || "Information about " + location + " is currently being prepared by travelers.";
    let info = `# ${location}\n\n${rawInfo}`;

    res.json({ 
      success: true, 
      base64: base64Data, 
      location, 
      info 
    });
  } catch (e) {
    console.error("Failed to get location info:", e);
    res.status(500).json({ success: false });
  }
});

// On-demand AI Teleport endpoint - Runs only when a user explicitly requests a dynamic AI merge
app.post("/api/teleport-ai", async (req, res) => {
  try {
    const { location, userImageBase64 } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ success: false, error: "Missing Gemini API Key." });
    }

    let parts: any[] = [{ text: `A bright, vivid, photorealistic travel photo taken directly in front of the ${location}. Extremely detailed background. High quality, stunning. Keep the exact same subjects from the original image—preserving the exact number of people, their faces, body structures, and poses. Only change their outfits to be culturally or weather appropriate for the location, and seamlessly place them in this new environment.` }];
    
    if (userImageBase64) {
      const match = userImageBase64.match(/^data:(image\/[a-zA-Z]*);base64,([^"]*)$/);
      if (match && match.length === 3) {
        parts.unshift({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    console.log(`Generating AI Travel composite for ${location}...`);
    const imageResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: { parts },
      config: {
        imageConfig: { aspectRatio: "3:4" }
      },
    });

    let finalBase64 = "";
    if (imageResponse) {
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          finalBase64 = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!finalBase64) {
      throw new Error("No image data returned from Gemini Image API.");
    }

    res.json({ success: true, base64: finalBase64 });
  } catch (e: any) {
    console.error("AI Teleport Error:", e);
    res.status(500).json({ success: false, error: e?.message || "Quota limit or service error." });
  }
});

// API endpoint for generating location description
app.post("/api/location-info", async (req, res) => {
  try {
    const { location } = req.body;
    let rawInfo = locationDescriptions[location];
    if (rawInfo) {
      return res.json({ info: `# ${location}\n\n${rawInfo}` });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ info: "Information about " + location + " is not available because the Gemini API key is missing." });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Provide information about ${location} exactly in this format:
# [Name of Location], [Name of Country] [Country Flag Emoji]
[One short, engaging paragraph about the location as a travel destination]
Do not include any other text or introductory phrases.`,
    });
    res.json({ info: response.text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ info: "Could not load information at this time." });
  }
});

// API endpoint to start omni generation
app.post('/api/generate-video', async (req, res) => {
  try {
    const { imageBase64, prompt } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ success: false, error: "Missing API Key" });
    }

    const match = imageBase64.match(/^data:(image\/[a-zA-Z]*);base64,([^"]*)$/);
    if (!match || match.length !== 3) {
      return res.status(400).json({ success: false, error: "Invalid base64 image" });
    }

    console.log(`Sending request to Gemini Omni...`);

    const interaction = await ai.interactions.create({
      model: 'gemini-omni-flash-preview',
      input: [
          { type: 'image' as const, data: match[2], mime_type: match[1] },
          { type: 'text', text: prompt || 'A beautiful cinematic panning video' }
      ],
      response_format: { type: 'video', delivery: 'uri' },
      store: true,
      background: false,
      stream: false
    });

    console.log(`Interaction created: ${interaction.id}`);
    
    if (!interaction.output_video || !interaction.output_video.uri) {
      throw new Error('No video URI returned from interaction.');
    }
    
    const fileIdMatch = interaction.output_video.uri.match(/files\/([a-zA-Z0-9_-]+)/);
    const fileId = fileIdMatch ? fileIdMatch[1] : null;

    res.json({ success: true, interactionId: interaction.id, uri: interaction.output_video.uri, fileId });
  } catch (e: any) {
    const errMsg = e?.message || e?.statusText || String(e);
    console.log('Video generation rate-limited or unavailable; utilizing cinematic panning fallback:', errMsg);
    res.status(200).json({ success: false, error: errMsg });
  }
});

// Daily Interest Distribution Endpoint (Simulated CRON Job trigger)
app.post('/api/admin/distribute-interest', async (req, res) => {
  try {
    const { secret } = req.body;
    // Basic security check
    if (secret !== 'vinclub-internal-cron-key') {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    console.log("Starting daily interest distribution (0.4%)...");
    
    // 1. Generate reference date (YYYY-MM-DD)
    const now = new Date();
    const refDate = now.toISOString().split('T')[0]; // e.g., "2024-05-20"

    // 2. Query already processed transactions for today to ensure idempotency
    const processedSnap = await dbAdmin.collection('transactions')
      .where('type', '==', 'plus')
      .where('paymentMethod', '==', 'system')
      .where('referenceDate', '==', refDate)
      .get();
    
    const processedUserIds = new Set(processedSnap.docs.map(doc => doc.data().userId));
    console.log(`Already processed today: ${processedUserIds.size} users.`);

    const usersSnap = await dbAdmin.collection('users').get();
    const transactionsRef = dbAdmin.collection('transactions');
    
    let count = 0;
    let totalDistributed = 0;
    const batches = [];
    let currentBatch = dbAdmin.batch();
    let currentBatchSize = 0;

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Skip if already processed today
      if (processedUserIds.has(userId)) continue;

      const currentPoints = userData.points || 0;
      
      if (currentPoints > 0) {
        const interestRate = 0.004; // 0.4%
        const interestAmount = Math.floor(currentPoints * interestRate);
        
        if (interestAmount > 0) {
          // Check batch limit (Firestore limit is 500 operations)
          // Each iteration here adds 2 operations: 1 update + 1 set
          if (currentBatchSize + 2 > 450) {
            batches.push(currentBatch);
            currentBatch = dbAdmin.batch();
            currentBatchSize = 0;
          }

          // Update user points
          const userRef = dbAdmin.collection('users').doc(userId);
          currentBatch.update(userRef, {
            points: FieldValue.increment(interestAmount)
          });

          // Create transaction log
          const txRef = transactionsRef.doc();
          currentBatch.set(txRef, {
            userId: userId,
            userName: userData.fullName || 'Hội viên VinClub',
            amount: interestAmount,
            type: 'plus',
            paymentMethod: 'system',
            status: 'Thành công',
            description: 'Lợi nhuận ủy thác hằng ngày (0.4%)',
            referenceDate: refDate, // Idempotency key
            date: now.toISOString(),
            createdAt: FieldValue.serverTimestamp()
          });

          count++;
          currentBatchSize += 2;
          totalDistributed += interestAmount;
        }
      }
    }

    if (currentBatchSize > 0) {
      batches.push(currentBatch);
    }

    // 3. Execute all batches sequentially to avoid overloading
    for (const b of batches) {
      await b.commit();
    }

    console.log(`Successfully distributed interest to ${count} users. Total: ${totalDistributed} points.`);
    res.json({ 
      success: true, 
      message: `Đã phân phối lãi suất cho ${count} hội viên.`,
      totalUsers: count,
      totalPoints: totalDistributed,
      referenceDate: refDate
    });
  } catch (error: any) {
    console.error("Error distributing interest:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to poll file status
app.post('/api/video-status', async (req, res) => {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ error: "fileId is required" });
    
    const fInfo = await ai.files.get({ name: `files/${fileId}` });
    const state = (fInfo.state as any)?.name || fInfo.state;
    // Map state to the expected 'done' boolean for the frontend
    const done = state === 'ACTIVE' || state === 'FAILED' || state === 'STATE_UNSPECIFIED' ? state === 'ACTIVE' : (state === 'SUCCEEDED' || state === 'FAILED');
    
    // Usually, if it's available for download it's ACTIVE, but we'll return the raw state too
    res.json({ done: state === 'ACTIVE' || state === 'SUCCEEDED', state });
  } catch(e: any) {
    console.log("Video polling error (will fall back gracefully):", e.message || e);
    res.status(200).json({ success: false, error: e.message || String(e) });
  }
});

const videoCache = new Map<string, Buffer>();

app.get('/api/video-download', async (req, res) => {
  try {
    const fileId = req.query.fileId as string;
    if (!fileId) {
      return res.status(400).json({ error: "fileId is required" });
    }

    let buffer = videoCache.get(fileId);
    if (!buffer) {
      const apiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/files/${fileId}:download?alt=media&key=${apiKey}`;
      const upstream = await fetch(url);
      if (!upstream.ok) {
        return res.status(upstream.status).send(`Failed to fetch video: ${upstream.statusText}`);
      }
      buffer = Buffer.from(await upstream.arrayBuffer());
      if (videoCache.size >= 12) {
        const oldest = videoCache.keys().next().value;
        if (oldest) videoCache.delete(oldest);
      }
      videoCache.set(fileId, buffer);
    }

    const total = buffer.length;
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    const range = req.headers.range;
    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      let start = match && match[1] ? parseInt(match[1], 10) : 0;
      let end = match && match[2] ? parseInt(match[2], 10) : total - 1;
      if (Number.isNaN(start)) start = 0;
      if (Number.isNaN(end) || end >= total) end = total - 1;
      if (start > end || start >= total) {
        res.status(416).setHeader('Content-Range', `bytes */${total}`).end();
        return;
      }
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', end - start + 1);
      res.end(buffer.subarray(start, end + 1));
    } else {
      res.setHeader('Content-Length', total);
      res.end(buffer);
    }
  } catch(e: any) {
    console.error("Video download error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Vite middleware for development and static assets for production (only when running locally)
async function bootstrap() {
  if (!process.env.VERCEL) {
    const PORT = 3000;
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}
bootstrap();

export default app;
