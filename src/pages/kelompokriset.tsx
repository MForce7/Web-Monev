import { Fragment, useMemo, useState } from "react";
import InstansiBar from "../components/rekapitulasi/InstansiBar.tsx";

/* ---------- Data: Draft Kepka ORPA tentang Kelompok Riset Tahun 2026 ----------
   Tiap periset ditulis sebagai [nama, NIP, keterangan, jabatan fungsional]. */
type Periset = readonly [nama: string, nip: string, keterangan: string, jabatan: string];
type Kelompok = { nama: string; anggota: readonly Periset[] };
type PusatRiset = { nama: string; kelompok: readonly Kelompok[] };

const DATA: readonly PusatRiset[] = [
  {
    nama: "Pusat Riset Antariksa",
    kelompok: [
      {
        nama: "MATAHARI DAN AKTIVITASNYA",
        anggota: [
          ["Dr. Johan Muhamad, M.Sc.", "198410082008011005", "Koordinator", "Peneliti Ahli Madya"],
          ["Tiar Dani, M.Si.", "197906132006041017", "Anggota", "Peneliti Ahli Madya"],
          ["Rasdewita Kesumaningrum, M.Si.", "198105092005012005", "Anggota", "Peneliti Ahli Muda"],
          ["Santi Sulistiani, S.Si., M.Si.", "198207182005012005", "Anggota", "Peneliti Ahli Muda"],
          ["Ayu Dyah Pangestu, S.Si., M.Si.", "199611272019022001", "Anggota", "Penelaah Teknis Kebijakan"],
          ["Ir. Nanang Widodo, M.Si.", "196302101989121002", "Anggota", "Perekayasa Ahli Madya"],
        ],
      },
      {
        nama: "IONOSFER DAN PROPAGASI GELOMBANG RADIO",
        anggota: [
          ["Asnawi, S.Si., M.Sc.", "196908051999031004", "Koordinator", "Peneliti Ahli Madya"],
          ["Drs. Jiyo, M.Si.", "196112151991101001", "Anggota", "Peneliti Ahli Madya"],
          ["Varuliantor Dear, M.T.", "198106122008011011", "Anggota", "Peneliti Ahli Madya"],
          ["Adi Purwono, M.T.", "197807272003121001", "Anggota", "Peneliti Ahli Muda"],
          ["Afrizal B., S.Kom., M.Kom.", "197601012001121005", "Anggota", "Peneliti Ahli Muda"],
          ["Agri Faturahman, S.Si., M.Si.", "199412302019021001", "Anggota", "Peneliti Ahli Muda"],
          ["Nata Miharja, ST, M.T.", "197204252005011009", "Anggota", "Perekayasa Ahli Muda"],
          ["Sefria Anggarani, S.Si., M.Si.", "199003222014022004", "Anggota", "Penelaah Teknis Kebijakan"],
          ["Faruk Afero, S.Si., M.Eng.", "199305092019021001", "Anggota", "Peneliti Ahli Pertama"],
          ["Annis Siradj Mardiani, S.T.", "198306152009122003", "Anggota", "Analis Data Ilmiah Ahli Pertama"],
          ["Indah Susanti, S.T.", "197702092005012005", "Anggota", "Penata Penerbitan Ilmiah Ahli Muda"],
        ],
      },
      {
        nama: "ASTRONOMI DAN OBSERVATORIUM",
        anggota: [
          ["Prof. Dr. Thomas Djamaluddin", "196201231987031002", "Koordinator", "Peneliti Ahli Utama"],
          ["Dra. Clara Yono Yatini, M.Sc.", "196403091990072001", "Anggota", "Peneliti Ahli Utama"],
          ["Dr. Emanuel Sungging Mumpuni, S.Si., M.Si.", "197212242000031003", "Anggota", "Peneliti Ahli Madya"],
          ["Dr. Rhorom Priyatikanto, M.Si.", "198904102014021003", "Anggota", "Peneliti Ahli Madya"],
          ["Peberlin Parulian Sitompul, S.T., M.T., Ph.D.", "197802022006041003", "Anggota", "Peneliti Ahli Madya"],
          ["Farahhati Mumtahana, S.Si., M.Si.", "199001122014022003", "Anggota", "Peneliti Ahli Muda"],
          ["Elyyani, S.Si.", "197106151997032002", "Anggota", "Peneliti Ahli Muda"],
          ["Siti Maryam, S.T.", "197306181997032002", "Anggota", "Peneliti Ahli Muda"],
          ["Gerhana Puannandra Putri, S.Si.", "199009292018012002", "Anggota", "Peneliti Ahli Pertama"],
          ["Mulya Diana Murti, S.Si.", "199411132018012001", "Anggota", "Peneliti Ahli Pertama"],
          ["M. Ferdhiansyah Noor, S.Kom.", "197501302007011001", "Anggota", "Analis Data Ilmiah Ahli Pertama"],
        ],
      },
      {
        nama: "DINAMIKA LINGKUNGAN ANTARIKSA",
        anggota: [
          ["La Ode Muhammad Musafar Kilowasid, M.Sc.", "197109301997031004", "Koordinator", "Peneliti Ahli Muda"],
          ["Fitri Nuraeni, M.Si.", "198007042006042003", "Anggota", "Penelaah Teknis Kebijakan"],
          ["Anwar Santoso, M.Si.", "197110052000031005", "Anggota", "Peneliti Ahli Madya"],
          ["Mario Batubara, M.Si., Ph.D.", "198111172008011006", "Anggota", "Peneliti Ahli Madya"],
          ["Rizal Suryana, S.T., M.Sc.", "197810282006041002", "Anggota", "Peneliti Ahli Muda"],
          ["Mira Juangsih, M.Si.", "198009262008012009", "Anggota", "Peneliti Ahli Muda"],
          ["Setyanto Cahyo Pranoto, M.Si.", "198009122008011008", "Anggota", "Peneliti Ahli Muda"],
          ["Visca Wellyanita, M.Si.", "198006152005012011", "Anggota", "Peneliti Ahli Muda"],
          ["Elvina Ayu Ratnasari, S.Si.", "199310272019022001", "Anggota", "Peneliti Ahli Pertama"],
          ["Siska Filawati, M.Si.", "199305272015022001", "Anggota", "Peneliti Ahli Muda"],
          ["Moh Andi Aris Biyantoro, S.T.", "197701072009011004", "Anggota", "Perekayasa Ahli Pertama"],
          ["Silmie Vidiya Fani, S.T., M.Kom.", "198906152014022003", "Anggota", "Perekayasa Ahli Muda"],
          ["Rian Pramudia Salasa, S.Kom., M.Kom.", "198703162014021004", "Anggota", "Perekayasa Ahli Muda"],
          ["Ir. Erlansyah, M.T.", "196201231987031003", "Anggota", "Perekayasa Ahli Madya"],
          ["Musthofa Lathif, S.T., M.T.", "198004102008011016", "Anggota", "Peneliti Ahli Muda"],
          ["Neflia, M.Si.", "197903112005012009", "Anggota", "Peneliti Ahli Muda"],
          ["Dian Yudha Risdianto, M.T.", "198007262006041003", "Anggota", "Perekayasa Ahli Madya"],
        ],
      },
    ],
  },
  {
    nama: "Pusat Riset Teknologi Penerbangan",
    kelompok: [
      {
        nama: "AERODINAMIKA (Aerodynamics, AEDY)",
        anggota: [
          ["Ir. Agus Aribowo, M.Eng.", "197008071989011001", "Koordinator", "Perekayasa Ahli Madya"],
          ["Arifin Rasyadi Soemaryanto, S.T.", "198808292014021005", "Anggota", "Peneliti Ahli Pertama"],
          ["Dana Herdiana, S.T., M.T.", "198004302009011005", "Anggota", "Peneliti Ahli Muda"],
          ["Deasy Tresnoningrum, S.Si., M.T.", "198402202008012005", "Anggota", "Perekayasa Ahli Muda"],
          ["Dr. Fadilah Hasim, B.Eng., M.Sc.", "197007231989111001", "Anggota", "Perekayasa Ahli Utama"],
          ["Kurnia Hidayat, S.Si., M.T.", "199411212018011003", "Anggota", "Peneliti Ahli Pertama"],
          ["Sinung Tirtha Pinindriya, S.T., M.Eng.", "198005802010121001", "Anggota", "Peneliti Ahli Muda"],
          ["Zuhdhy Masfuri, S.T., M.T.", "198304292012121001", "Anggota", "Perekayasa Ahli Muda"],
        ],
      },
      {
        nama: "AEROSTRUKTUR (Aerostructure, AEST)",
        anggota: [
          ["Abian Nurrohmad, S.T., M.T.", "199512242018011001", "Koordinator", "Peneliti Ahli Madya"],
          ["Afid Nugroho, S.T., M.Eng.", "198301242009121001", "Anggota", "Peneliti Ahli Muda"],
          ["Dr. Dipl.Ing. Agus Bayu Utama, M.Sc.ME.", "197311051993021001", "Anggota", "Peneliti Ahli Madya"],
          ["Aryandi Marta, S.T., M.T.", "198803302014021001", "Anggota", "Peneliti Ahli Muda"],
          ["Awang Rahmadi Nuranto, S.T., M.T.", "197909262006041020", "Anggota", "Perekayasa Ahli Muda"],
          ["Dr. Dony Hidayat, S.T., M.T.", "198205272008011007", "Anggota", "Peneliti Ahli Madya"],
          ["Fajar Ari Wandono S.T., M.T.", "198501042010121001", "Anggota", "Peneliti Ahli Madya"],
          ["Ilham Akbar Adi Satriya, S.T., M.Sc.", "199610242019021001", "Anggota", "Perekayasa Ahli Muda"],
          ["Kosim Abdurohman, S.T., M.T.", "198601272014021003", "Anggota", "Peneliti Ahli Muda"],
          ["Mikhael Gilang Pribadi Putra Pratama, S.T., M.T.", "199403242019031002", "Anggota", "Peneliti Ahli Muda"],
          ["M Hafid, S.T., M.T.", "199412222019021001", "Anggota", "Perekayasa Ahli Pertama"],
          ["Muksin, S.Si.", "198809272018011001", "Anggota", "Perekayasa Ahli Muda"],
          ["Nur Mufidatul Ula, S.Si., M.EngSt.", "199301282018012002", "Anggota", "Penelaah Teknis Kebijakan"],
          ["Rian Suari Aritonang, S.T.", "198811292018011002", "Anggota", "Peneliti Ahli Pertama"],
          ["Riki Ardiansyah, S.T., M.T.", "198511292014021001", "Anggota", "Perekayasa Ahli Muda"],
          ["Taufiq Satrio Nurtiasto, S.T.", "199307072018011003", "Anggota", "Peneliti Ahli Pertama"],
          ["Yusuf Giri Wijaya, S.Si., M.T.", "198802072018011001", "Anggota", "Peneliti Ahli Pertama"],
        ],
      },
      {
        nama: "DINAMIKA STRUKTURAL DAN AEROELASTISITAS (Structural Dynamics and Aeroelasticity, SDA)",
        anggota: [
          ["Dr. Matza Gusto Andika, S.T., M.T.", "198507062009011002", "Koordinator", "Perekayasa Ahli Madya"],
          ["Drs. Agus Harno Nurdinsyah, M.Si.", "196303241990031005", "Anggota", "Peneliti Ahli Madya"],
          ["Ir. Gunawan Wijiatmoko, M.Eng.", "196209281988031001", "Anggota", "Perekayasa Ahli Utama"],
          ["Dr. Ivransa Zuhdi Pane, M.Eng.", "196905251987091001", "Anggota", "Perekayasa Ahli Utama"],
          ["Ir. Karyawan, M.Eng.", "196301281988011001", "Anggota", "Perekayasa Ahli Madya"],
          ["Dr. Khairul Jauhari, S.T., M.T.", "198105162009011002", "Anggota", "Perekayasa Ahli Muda"],
          ["Ir. Purwadi, M.Si.", "196205161991031001", "Anggota", "Perekayasa Ahli Utama"],
          ["Widyawasta, S.T., M.T.", "196408161985031007", "Anggota", "Perekayasa Ahli Madya"],
          ["Tarida Priskila Hasian Simanjuntak, S.T., M.Sc.", "199706142020122013", "Anggota", "Perekayasa Ahli Pertama"],
        ],
      },
      {
        nama: "SISTEM DAN APLIKASI DRONE (Drone System and Application, DSA)",
        anggota: [
          ["Drs. Gunawan Setyo Prabowo, M.T.", "196707241992031002", "Koordinator", "Peneliti Ahli Utama"],
          ["Abdul Aziz, S.T., M.Kom.", "199302142018011001", "Anggota", "Perekayasa Ahli Muda"],
          ["Dr. Akhmad Farid Widodo, S.T., M.T.", "197804272005021005", "Anggota", "Perekayasa Ahli Madya"],
          ["Andreas Prasetya Adi, M.Eng.", "197104071989121001", "Anggota", "Peneliti Ahli Muda"],
          ["Angga Septiyana, S.Si.", "199309042018011003", "Anggota", "Peneliti Ahli Pertama"],
          ["Apid Rustandi, S.Ds., M.Sc.", "198404092009121001", "Anggota", "Perekayasa Ahli Muda"],
          ["Aries Asrianto Ramadian, S.T., M.T.", "198904192018011002", "Anggota", "Perekayasa Ahli Pertama"],
          ["Drs. Ari Sugeng Budiyanta, M.Eng.", "196112121989121001", "Anggota", "Perekayasa Ahli Madya"],
          ["Danartomo Kusumoaji, S.T., M.T.", "198209252010121001", "Anggota", "Peneliti Ahli Muda"],
          ["Eries Bagita Jayanti, S.Si., M.T.", "199602192018012001", "Anggota", "Peneliti Ahli Pertama"],
          ["Hartono, S.T., M.T.", "198912202018011001", "Anggota", "Perekayasa Ahli Pertama"],
          ["Novita Atmasari, S.Si., M.T.", "199212092018012002", "Anggota", "Peneliti Ahli Pertama"],
          ["Prastiyo Siswo Prajoko, S.T., M.T.", "199106052010121003", "Anggota", "Perekayasa Ahli Muda"],
          ["Rudi Choirul Anwar, S.Si., M.T.", "199401062018011001", "Anggota", "Peneliti Ahli Pertama"],
          ["Try Kusuma Wardana, S.Si, M.Kom.", "199405262019021001", "Anggota", "Perekayasa Ahli Muda"],
          ["Unggul Satrio Yudhotomo, S.T., M.Han.", "197905292006041003", "Anggota", "Perekayasa Ahli Madya"],
        ],
      },
      {
        nama: "SISTEM KOMUNIKASI DATA LINK DAN NAVIGASI PENERBANGAN (Aviation Datalink Communication and Navigation System, ADCNS)",
        anggota: [
          ["Cahya Edi Santosa, M.T., Ph.D.", "197712232003121004", "Koordinator", "Peneliti Ahli Madya"],
          ["Dra. Donatina Miswati Hadiyanti", "196409061989122001", "Anggota", "Perekayasa Ahli Madya"],
          ["Hendy Santosa, S.T., M.T., Ph.D.", "198112102008121002", "Anggota", "Asisten Ahli"],
          ["Imas Tri Setyadewi, S.Si., M.T.", "198909182014022003", "Anggota", "Perekayasa Ahli Pertama"],
          ["Mohammad Amanta Kumala Sakti, S.T., M.T.", "198311232009121003", "Anggota", "Perekayasa Ahli Madya"],
          ["Novelita Rahayu, S.ST., M.T.", "199011202018012001", "Anggota", "Penelaah Teknis Kebijakan"],
          ["Ir. Subuh Pramono, S.T., M.T., Ph.D., IPM", "198106092003121002", "Anggota", "Lektor Kepala"],
          ["Wahyudi, S.Kom, M.Kom.", "197412282005011005", "Anggota", "Perekayasa Ahli Muda"],
          ["Yanuar Prabowo, S.T., M.T.", "198401062010121001", "Anggota", "Peneliti Ahli Muda"],
        ],
      },
      {
        nama: "SISTEM MUATAN DAN PENGINDERAAN (Payload and Aerosense System, PAS)",
        anggota: [
          ["Farohaji Kurniawan, S.T., M.Eng., Ph.D.", "198301222009011006", "Koordinator", "Peneliti Ahli Madya"],
          ["Abdul Rohman, S.T.", "199404082018011003", "Anggota", "Perekayasa Ahli Pertama"],
          ["Abdurrasyid Ruhiyat, SST., M.T.", "199109142018011002", "Anggota", "Penelaah Teknis Kebijakan"],
          ["Agus Hendra Wahyudi, S.T., M.Si., Ph.D.", "197908282005011006", "Anggota", "Peneliti Ahli Muda"],
          ["Agus Wiyono, S.Si., M.T.", "198105062009011008", "Anggota", "Peneliti Ahli Muda"],
          ["Hidayati Mardikasari, S.T.", "199008172018012002", "Anggota", "Perekayasa Ahli Pertama"],
          ["Irma Rismayanti, S.ST.", "199308092018012002", "Anggota", "Perekayasa Ahli Muda"],
          ["Jefri Abner Hamonangan, S.T., M.Si.", "198006172006041005", "Anggota", "Peneliti Ahli Muda"],
          ["Nurul Chasanah, S.T.", "199304172020122013", "Anggota", "Perekayasa Ahli Pertama"],
          ["Satria Arief Aditya, S.Pd., M.Tr.T.", "198801282010121004", "Anggota", "Perekayasa Ahli Muda"],
        ],
      },
      {
        nama: "MEKANIKA DAN KENDALI TERBANG (Flight Mechanic and Control, FMC)",
        anggota: [
          ["Teuku Mohd Ichwanul Hakim, S.T., M.T.", "198104212006041027", "Koordinator", "Peneliti Ahli Muda"],
          ["Adi Wirawan, S.Si., M.T.", "198202182009121001", "Anggota", "Peneliti Ahli Muda"],
          ["Agus Sawukir, S.T., M.T.", "198107242015031001", "Anggota", "Perekayasa Ahli Muda"],
          ["Annisa Sarah, S.Si., M.Si.", "198804072014022004", "Anggota", "Perekayasa Ahli Muda"],
          ["Ardanto Mohammad Pramutadi, S.T., M.T.", "198711022014021004", "Anggota", "Peneliti Ahli Pertama"],
          ["Muhammad Fajar, S.T., M.T.", "198503132008011001", "Anggota", "Perekayasa Ahli Madya"],
          ["Prasetyo Ardi Probo Suseno, S.T., M.T.", "199210062018011001", "Anggota", "Peneliti Ahli Muda"],
        ],
      },
      {
        nama: "SISTEM AVIONIK DAN MISI (Avionics and Mission System, AMS)",
        anggota: [
          ["Dr. Fadjar Rahino Triputra, M.Eng.", "196906241988121001", "Koordinator", "Perekayasa Ahli Madya"],
          ["Aris Surya Yunata, S.T., M.T.", "198606302014031002", "Anggota", "Perekayasa Ahli Muda"],
          ["Asyaraf Hidayat, S.T.", "199704062020121006", "Anggota", "Perekayasa Ahli Pertama"],
          ["Irfansyah Yudhi Tanasa, S.T., M.Sc.", "198408232009011002", "Anggota", "Perekayasa Ahli Muda"],
          ["Dr. Yomi Guno, S.Si., M.T.", "197906082008011010", "Anggota", "Perekayasa Ahli Madya"],
        ],
      },
      {
        nama: "AERONAUTIKA BERKELANJUTAN (Sustainable Aeronautics, SA)",
        anggota: [
          ["Muhammad Ilham Adhynugraha, ST., M.T., Ph.D.", "198310282009121003", "Koordinator", "Perekayasa Ahli Madya"],
          ["Afdal Adha, S.T.", "199306012018021001", "Anggota", "Penelaah Teknis Kebijakan"],
          ["Agus Suprianto, S.T., M.T.", "198611022010121004", "Anggota", "Perekayasa Ahli Muda"],
          ["Ir. Atik Bintoro, M.T.", "196406061990031002", "Anggota", "Peneliti Ahli Utama"],
          ["Chairunnisa, S.T., M.T.", "199006162018012002", "Anggota", "Perekayasa Ahli Muda"],
          ["Dewi Habsari Budiarti, ST., M.T., Ph.D.", "198010052005022001", "Anggota", "Perekayasa Ahli Muda"],
          ["Ilham Bagus Wiranto, S.T.", "199612212020121006", "Anggota", "Perekayasa Ahli Pertama"],
          ["Fadli Cahya Megawanto, S.T., M.T.", "198410132009121001", "Anggota", "Perekayasa Ahli Madya"],
          ["Fithri Nur Purnamastuti, S.T., M.Eng.", "198310172014022001", "Anggota", "Perekayasa Ahli Muda"],
          ["Dr. Ir. Jemie Muliadi, S.T., M.T.", "197907172006041004", "Anggota", "Perekayasa Ahli Madya"],
          ["Nurhadi Pramana, S.T.", "199008062014021003", "Anggota", "Perekayasa Ahli Muda"],
          ["Rinal Kharis, S.T, M.T.", "198808202012121002", "Anggota", "Perekayasa Ahli Muda"],
          ["Sherly Octavia Saraswati, S.T.", "199310222020122015", "Anggota", "Perekayasa Ahli Pertama"],
          ["Siti Vivi Octaviany, S.T., M.T.", "199210252019022004", "Anggota", "Perekayasa Ahli Muda"],
        ],
      },
    ],
  },
  {
    nama: "Pusat Riset Teknologi Satelit",
    kelompok: [
      {
        nama: "LINGKUNGAN DAN DINAMIKA SATELIT",
        anggota: [
          ["Ery Fitrianingsih, S.T., M.Sc., Ph.D.", "197809092003122005", "Koordinator", "Peneliti Ahli Muda"],
          ["Affiani Machmudah, S.T., M.Sc., Ph.D.", "198009162022212003", "Anggota", "Peneliti Ahli Madya"],
          ["Suraduita Mupasanta, S.T., M.Sc.", "199401142020122012", "Anggota", "Perekayasa Ahli Pertama"],
          ["Adi Farmasiantoro, S.Kom.", "197907062005011004", "Anggota", "Perekayasa Ahli Muda"],
          ["Hasan Mayditia, S.Si., M.T.", "198405022006041008", "Anggota", "Peneliti Ahli Muda"],
          ["Dessi Marlia, S.T., M.Eng.", "198012212009012003", "Anggota", "Penelaah Teknis Kebijakan"],
        ],
      },
      {
        nama: "SISTEM ELEKTRONIKA DAYA SATELIT",
        anggota: [
          ["Abdul Karim, S.T., M.T.", "197610132003121003", "Koordinator", "Perekayasa Ahli Madya"],
          ["Dr. Dewi Anggraeni, S.T., M.T.", "198208182008012015", "Anggota", "Perekayasa Ahli Madya"],
          ["Ahmad Fauzi, S.T.", "197507052005011005", "Anggota", "Peneliti Ahli Muda"],
          ["Desti Ika Suryanti, S.Si., M.T.", "198612262014022001", "Anggota", "Peneliti Ahli Muda"],
        ],
      },
      {
        nama: "SISTEM ELEKTRONIKA, KOMPUTASI DAN MEKATRONIKA SATELIT",
        anggota: [
          ["Muhammad Taufik, S.T., M.T.", "199003302014021005", "Koordinator", "Perekayasa Ahli Muda"],
          ["Bina Pratomo, S.T., M.Si.", "197911042005011005", "Anggota", "Peneliti Ahli Muda"],
          ["Deddy El Amin, S.T., M. Kom.", "198405112009011007", "Anggota", "Perekayasa Ahli Muda"],
          ["Nugroho Widi Jatmiko, S.T., M.Eng.", "197812032006041001", "Anggota", "Peneliti Ahli Muda"],
          ["Aditya Bayu Erwindu, S.T.", "199305282018011002", "Anggota", "Penelaah Teknis Kebijakan"],
        ],
      },
      {
        nama: "SISTEM KOMUNIKASI SATELIT",
        anggota: [
          ["Eriko Nasemudin Nasser, S.T., M.Sc.", "197803152002121005", "Koordinator", "Peneliti Ahli Muda"],
          ["Nayla Najati, S.T., M.T.", "198111092006042003", "Anggota", "Perekayasa Ahli Madya"],
          ["Aulia Haque Qonita, S.T.", "199410132018012001", "Anggota", "Penelaah Teknis Kebijakan"],
          ["Anshari Akbar, S.T. , M.T.", "198005222006041025", "Anggota", "Peneliti Ahli Pertama"],
          ["Dwiyanto, S.T., M.T.", "197602062005011007", "Anggota", "Peneliti Ahli Muda"],
          ["Rifki Ardinal, S.T.", "198610262010121002", "Anggota", "Perekayasa Ahli Pertama"],
          ["Maulana Ali Arifin, S.T.", "199506052018011001", "Anggota", "Perekayasa Ahli Pertama"],
          ["Widya Roza, S.T., M.Sc.", "198104032006042008", "Anggota", "Perekayasa Ahli Madya"],
          ["Hidayah, S.T.", "199306192020122017", "Anggota", "Perekayasa Ahli Pertama"],
          ["Hogan Eighfansyah Susilo, S.T., M.T.", "199508142019021001", "Anggota", "Peneliti Ahli Pertama"],
          ["Nurul Muhtadin, S.T., M.T.", "199109262018011001", "Anggota", "Perekayasa Ahli Muda"],
          ["Rosza Madina, S.T., M.T.", "198509222009122002", "Anggota", "Perekayasa Ahli Muda"],
        ],
      },
      {
        nama: "SISTEM MUATAN OPTIK & SAR SATELIT",
        anggota: [
          ["Patria Rachman Hakim, M.T.", "198204302010121002", "Koordinator", "Peneliti Ahli Madya"],
          ["Ir. Andi Mukhtar Tahir, M.T.", "196206061989031007", "Anggota", "Perekayasa Ahli Madya"],
          ["A. Hadi Syafrudin, S.T., M.Sc.", "198011232006041003", "Anggota", "Peneliti Ahli Muda"],
          ["Sartika Salaswati, S.Si.", "199012222014022004", "Anggota", "Perekayasa Ahli Muda"],
          ["Ega Asti Anggari, S.Si.", "199406072019022001", "Anggota", "Perekayasa Ahli Pertama"],
          ["Agung Wahyudiono, S.Pd., M.Sc.", "198502172014021003", "Anggota", "Peneliti Ahli Pertama"],
          ["Ahmad Maryanto, S.Si., M.T.", "196402021994031003", "Anggota", "Perekayasa Ahli Madya"],
          ["Rommy Hartono, S.T.", "198803292015021001", "Anggota", "Perekayasa Ahli Muda"],
          ["Dede Ardianto, S.T.", "199201312018011002", "Anggota", "Perekayasa Ahli Pertama"],
          ["Agus Herawan, S.Kom., M.Kom.", "198002232006041014", "Anggota", "Peneliti Ahli Madya"],
          ["Gafur Hasan Zam Bahari, S.T.", "199505042018011001", "Anggota", "Peneliti Ahli Pertama"],
          ["Elvira Rachim, S.Kom.", "197903282006042031", "Anggota", "Peneliti Ahli Muda"],
          ["Mukhamad Fajar Amiludin, S.Tr.T.", "199504132020121013", "Anggota", "Perekayasa Ahli Pertama"],
        ],
      },
      {
        nama: "SISTEM RUAS BUMI DAN OPERASIONAL SATELIT",
        anggota: [
          ["Dr.-Ing. Mohammad Mukhayadi, S.T., M.Kom.", "197709172002121004", "Koordinator", "Perekayasa Ahli Madya"],
          ["Dr.-Ing. Wahyudi Hasbi, S.Si., M.Kom.", "197610252001121003", "Anggota", "Peneliti Ahli Utama"],
          ["Rizki Permala, S.T., M.Kom.", "198504182010121001", "Anggota", "Perekayasa Ahli Madya"],
          ["Muazam Nugroho, S.T., M.Sc.", "199010072018011003", "Anggota", "Peneliti Ahli Pertama"],
          ["Hidayat Gunawan, M.Eng.", "196708171987011001", "Anggota", "Perekayasa Ahli Madya"],
          ["Ir. Dedi Irawadi", "196606121987011001", "Anggota", "Perekayasa Ahli Madya"],
          ["Muchammad Soleh, S.T., M.Eng.", "197610212005011005", "Anggota", "Perekayasa Ahli Madya"],
          ["Dicka Ariptian Rahayu, S.T.", "199508172019021001", "Anggota", "Perekayasa Ahli Pertama"],
          ["M. Arif Saifudin, S.T., M.Kom.", "197709132006041003", "Anggota", "Perekayasa Ahli Madya"],
          ["Satriya Utama, S.T., M.T.", "198904052015021001", "Anggota", "Peneliti Ahli Muda"],
          ["Nurrochman Ferdiansyah, S.Kom.", "199202202019021002", "Anggota", "Perekayasa Ahli Pertama"],
          ["Ali Syahputra Nasution, S.T., M.T.", "198304162008011006", "Anggota", "Perekayasa Ahli Madya"],
          ["Nur Salma Yusuf Hasanah, S.Si.", "199606012019022001", "Anggota", "Perekayasa Ahli Pertama"],
          ["Futikhatun Rohmah, S.T.", "199508312018012002", "Anggota", "Peneliti Ahli Pertama"],
          ["Amrullah Abdul Qadir, S.T., M.Sc.", "198709052015021002", "Anggota", "Perekayasa Ahli Pertama"],
          ["Wakhid Abdurrokhman, S.T.", "198911182019021001", "Anggota", "Perekayasa Ahli Pertama"],
          ["Drs. Supriyono, M.T.", "196412101991031005", "Anggota", "Peneliti Ahli Madya"],
          ["Dinari Nikken Sulastrie Sirin, S.T., M.T.", "198004292008012012", "Anggota", "Perekayasa Ahli Muda"],
          ["Yuvita Dian Safitri, S.S.T., M.Eng.Sc.", "199602202018012004", "Anggota", "Perekayasa Ahli Pertama"],
          ["Dr. Andy Indradjad, S.Si., M.Eng.", "197507012005011015", "Anggota", "Peneliti Ahli Muda"],
          ["Musyarofah, S.Si.", "198010152008012009", "Anggota", "Peneliti Ahli Pertama"],
          ["Prof. Dr. Ir. Rr. Erna Sri Adiningsih, M.Si.", "196311081989012001", "Anggota", "Peneliti Ahli Utama"],
          ["Chusnul Tri Judianto, S.T., M.M.", "196704151999031001", "Anggota", "Perekayasa Ahli Madya"],
          ["Tri Meidiansyah, S.T.", "197105102005011011", "Anggota", "Perekayasa Ahli Muda"],
          ["Ir. Suhermanto, M.T.", "196001151987011001", "Anggota", "Peneliti Ahli Utama"],
        ],
      },
      {
        nama: "STRUKTUR, SISTEM THERMAL & KEANDALAN SATELIT",
        anggota: [
          ["Moh. Farid Huzain, M.Eng.", "198203302009121002", "Koordinator", "Perekayasa Ahli Madya"],
          ["Poki Agung Budiantoro, S.T., M.T.", "198108092008011008", "Anggota", "Perekayasa Ahli Madya"],
          ["Ir. Widodo Slamet, M.T.", "196207151992031005", "Anggota", "Peneliti Ahli Madya"],
          ["Rendy Kurniawan, S.T.", "199305152019021001", "Anggota", "Perekayasa Ahli Pertama"],
          ["Puji Rianto, S.T.", "199205232019021001", "Anggota", "Perekayasa Ahli Pertama"],
          ["Wahyu Akbar Megah, S.T.", "198702252010121001", "Anggota", "Perekayasa Ahli Muda"],
          ["Moedji Soedjarwo, S.T.", "196008031985031007", "Anggota", "Peneliti Ahli Madya"],
        ],
      },
    ],
  },
  {
    nama: "Pusat Riset Teknologi Roket",
    kelompok: [
      {
        nama: "DINAMIKA ROKET DAN KONTROL (ROCKET DYNAMICS & CONTROL)",
        anggota: [
          ["Dr. Rika Andiarti", "196701301987012000", "Ketua", "Perekayasa Ahli Utama"],
          ["Dr. Herma Yudhi Irwanto, M.Eng.", "196712301987011001", "Anggota", "Peneliti Ahli Madya"],
          ["Dr. Larasmoyo Nugroho, S.T., M.Ds.", "197312302008011004", "Anggota", "Peneliti Ahli Muda"],
          ["Idris Eko Putro, S.T., M.Sc.AE.", "197805072003121005", "Anggota", "Peneliti Ahli Madya"],
          ["Endro Artono, M.T.", "197807172005011008", "Anggota", "Peneliti Ahli Muda"],
          ["Ahmad Riyadl, S.T., M.Han.", "197810042002121000", "Anggota", "Peneliti Ahli Muda"],
          ["Dr. Effendi Dodi Arisandi, S.T., M.Si.", "197910022006041015", "Anggota", "Peneliti Ahli Madya"],
          ["Hakiki, S.T., M.Sc.", "198001242009121001", "Anggota", "Peneliti Ahli Pertama"],
          ["Oka Sudiana, S.T., MAE.", "198307252009121001", "Anggota", "Peneliti Ahli Pertama"],
          ["Muhammad Ridlo Erdata Nasution, S.T., M.T., Ph.D.", "198806082024031001", "Anggota", "Peneliti Ahli Muda"],
          ["Ardian Wardhana, S.T.", "199310142020121010", "Anggota", "Perekayasa Ahli Pertama"],
          ["Nurul Fahrizatul Rohmah, S.ST.", "199608042019022001", "Anggota", "Perekayasa Ahli Pertama"],
          ["Fikana Mahardika Cantri, S.Tr.T.", "199708172020122012", "Anggota", "Perekayasa Ahli Pertama"],
        ],
      },
      {
        nama: "INSULASI TERMAL DAN MATERIAL ENERGETIK (THERMAL INSULATION & ENERGETIC MATERIAL)",
        anggota: [
          ["Prof. Dr. Ir. Heri Budi Wibowo, M.T.", "196906211993031002", "Ketua", "Peneliti Ahli Utama"],
          ["Drs. Sutrisno, M.Si.", "196305261990011001", "Koordinator", "Peneliti Ahli Utama"],
          ["Dr. Kendra Hartaya, M.Si.", "196505051992031009", "Anggota", "Peneliti Ahli Utama"],
          ["Retno Ardianingsih, S.T., M.T.", "198301102009012010", "Anggota", "Peneliti Ahli Muda"],
          ["Luthfia Hajar Abdillah, S.T., M.T.", "198601032009012005", "Anggota", "Peneliti Ahli Muda"],
          ["Hamonangan R. Sitompul, S.Si.", "199204012019021002", "Anggota", "Peneliti Ahli Pertama"],
        ],
      },
      {
        nama: "SISTEM PROPELAN (PROPELLANT SYSTEM)",
        anggota: [
          ["Dr. Heru Supriyatno, M.Eng.", "196805301988021001", "Ketua", "Peneliti Ahli Madya"],
          ["Ir. Henny Setyaningsih, M.Si.", "196009121985032001", "Anggota", "Perekayasa Ahli Utama"],
          ["Yudha Budiman, S.Si.", "196902051996031002", "Anggota", "Perekayasa Ahli Muda"],
          ["Evie Lestariana, S.T.", "197504232002122002", "Anggota", "Peneliti Ahli Muda"],
          ["Dwi Setyaningsih, S.T., M.Si.", "198105052005012016", "Anggota", "Peneliti Ahli Muda"],
          ["Wiwiek Utami Dewi, S.T., M.Si.", "198408182008012003", "Anggota", "Perekayasa Ahli Madya"],
          ["Mohamad Baiquni, S.T., M.Si.", "198408212009121003", "Anggota", "Peneliti Ahli Muda"],
          ["Anita Pinalia, S.T., M.Si.", "198502232009122001", "Anggota", "Peneliti Ahli Muda"],
          ["Haendy Busman, S.Kom.", "198806232008011001", "Anggota", "Analis Data Ilmiah Ahli Pertama"],
          ["Rama Dwi Prayoga, S.T.", "198808092014021005", "Anggota", "Perekayasa Ahli Pertama"],
          ["Aprilia Fitri Yastuti, S.Si.", "199004192014022005", "Anggota", "Peneliti Ahli Pertama"],
          ["Yulia Azatil Ismah, S.T.", "199007142014022006", "Anggota", "Peneliti Ahli Pertama"],
          ["Ichsan Dwi Prasetyo, S.ST.", "199309052019021001", "Anggota", "Perekayasa Ahli Pertama"],
          ["Maharani Inas Mahdiyyah, S.T.", "199511022020122012", "Anggota", "Perekayasa Ahli Pertama"],
          ["Rizky Sutrisna, S.T.", "199511202018011003", "Anggota", "Perekayasa Ahli Pertama"],
          ["Arbela Dani Budisusilo, S.Si.", "199603122020121011", "Anggota", "Perekayasa Ahli Pertama"],
        ],
      },
      {
        nama: "PROPULSI MAJU (ADVANCED PROPULSION)",
        anggota: [
          ["Dr. Arif Nur Hakim, M.Eng.", "197505101994031001", "Ketua", "Peneliti Ahli Madya"],
          ["Bayu Prianto, M.Si.", "198310282006041003", "Anggota", "Peneliti Ahli Muda"],
          ["Bagus Wicaksono, S.Si., M.T.", "198401312010121001", "Anggota", "Peneliti Ahli Pertama"],
          ["Taufiqur Rohman, S.T., M.T.", "198710212014021001", "Anggota", "Peneliti Ahli Pertama"],
          ["Ikhwannuary Raditya Priyadana, S.Si.", "199101302018011002", "Anggota", "Perekayasa Ahli Pertama"],
          ["Starida Sofia Moranova, S.T.", "199411052020122015", "Anggota", "Perekayasa Ahli Pertama"],
          ["Firza Fadlan Ekadj, S.T.", "199610172020121007", "Anggota", "Perekayasa Ahli Pertama"],
        ],
      },
      {
        nama: "PROPULSI ROKET PADAT (SOLID ROCKET PROPULSION)",
        anggota: [
          ["Dr. Bagus Hayatul Jihad, M.T.", "196807101991101001", "Ketua", "Peneliti Ahli Madya"],
          ["Ir. Saeri, M.Si.", "196410011992031003", "Anggota", "Perekayasa Ahli Madya"],
          ["Ahmad Jamaludin Fitroh, M.T.", "198008052008011020", "Anggota", "Peneliti Ahli Muda"],
          ["Soleh Fajar Junjunan, S.T., M.T.", "198702182014021004", "Anggota", "Penelaah Teknis Kebijakan"],
        ],
      },
      {
        nama: "SISTEM TELEMETRI (TELEMETRY SYSTEM)",
        anggota: [
          ["Ing. Anita Pascawati, S.T.", "198410022009122002", "Ketua", "Peneliti Ahli Pertama"],
          ["Rachmat Ramdani, M.T.", "197210051998031004", "Anggota", "Peneliti Ahli Muda"],
          ["Sonny Dwi Harsono, S.T., M.Eng.", "198012192006041002", "Anggota", "Peneliti Ahli Pertama"],
          ["Kandi Rahardiyanti, S.T., M.T.", "198908302014022003", "Anggota", "Perekayasa Ahli Pertama"],
          ["Mirza Zulfikar Rahmat, S.T.", "198909182018011001", "Anggota", "Perekayasa Ahli Pertama"],
        ],
      },
      {
        nama: "STRUKTUR ROKET DAN MATERIAL (ROCKET STRUCTURE AND MATERIALS)",
        anggota: [
          ["Lilis Mariani, M.Eng.", "196803191987012001", "Ketua", "Perekayasa Ahli Madya"],
          ["Ir. Mujtahid, M.T.", "196509081991011001", "Anggota", "Perekayasa Ahli Madya"],
          ["Herry Purnomo, S.T., M.T.", "198102182006041004", "Anggota", "Perekayasa Ahli Madya"],
          ["Hendra Gantina, S.T.", "198508162010121001", "Anggota", "Perekayasa Ahli Pertama"],
          ["Dr. Novi Andria, S.T., M.Sc.", "198511182009011003", "Anggota", "Peneliti Ahli Muda"],
          ["Mahfud Ibadi, S.Pd., M.T.", "198702142014021001", "Anggota", "Perekayasa Ahli Muda"],
          ["M. Dito Saputra, S.T., M.Sc.", "199006292018011002", "Anggota", "Peneliti Ahli Pertama"],
          ["Arief Budi Sanjaya, S.T., M.Sc.", "199203152018011001", "Anggota", "Peneliti Ahli Pertama"],
          ["Haryadi Abrizal, S.T.", "199210052018011004", "Anggota", "Peneliti Ahli Pertama"],
          ["Muhamad Hananuputra Setianto, S.T., M.T.", "199501142018011003", "Anggota", "Penelaah Teknis Kebijakan"],
          ["Ahmedi Asraf, S.Si.", "199504022019021001", "Anggota", "Perekayasa Ahli Pertama"],
        ],
      },
    ],
  },
];

/* ---------- Tampilan ---------- */
/** Font, warna, dan sudut disamakan dengan Dashboard: Inter tebal, merah merek, sudut membulat */
const FONT = "font-['Inter',ui-sans-serif,system-ui,sans-serif]";
const MERAH_BG = "bg-[#ee2a3c]";
const MERAH_TEKS = "text-[#ee2a3c]";
const MERAH_TUA_BG = "bg-[#b3121f]";

/** Lebar kolom (%), total 100 */
const WIDTHS = [5, 20, 25, 15, 10, 25];
const KOLOM = ["No", "Nama Kelompok Riset", "Nama Periset", "NIP", "Keterangan", "Jabatan Fungsional"];
const SEMUA = "Semua Pusat Riset";

/** Kelas untuk teks header supaya bisa turun baris */
const WRAP = "break-words whitespace-normal";

/** Warna lencana keterangan: pimpinan kelompok merah, anggota abu-abu */
const LENCANA = {
  pimpinan: "bg-red-50 text-[#d61f31] border-red-200",
  anggota: "bg-slate-100 text-slate-600 border-slate-200",
};
const lencana = (ket: string) => (ket === "Anggota" ? LENCANA.anggota : LENCANA.pimpinan);

/** Gaya cetak: hanya tabel yang tercetak (landscape), bilah alat disembunyikan */
function PrintStyles() {
  return (
    <style>{`
      @media print {
        body * { visibility: hidden; }
        .kr-print, .kr-print * { visibility: visible; }
        .kr-print { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; }
        .no-print { display: none !important; }
        @page { size: A4 landscape; margin: 10mm; }
      }
    `}</style>
  );
}

function KelompokRisetTable() {
  const [pusat, setPusat] = useState(SEMUA);
  const [cari, setCari] = useState("");

  const total = useMemo(
    () => ({
      kelompok: DATA.reduce((n, p) => n + p.kelompok.length, 0),
      periset: DATA.reduce((n, p) => n + p.kelompok.reduce((m, k) => m + k.anggota.length, 0), 0),
    }),
    [],
  );

  /** Terapkan filter pusat riset + pencarian. Nomor anggota dihitung sebelum difilter supaya tidak bergeser. */
  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return DATA.filter((p) => pusat === SEMUA || p.nama === pusat)
      .map((p) => ({
        nama: p.nama,
        kelompok: p.kelompok
          .map((k, idx) => {
            const semua = k.anggota.map(([nama, nip, keterangan, jabatan], i) => ({
              nama,
              nip,
              keterangan,
              jabatan,
              no: i + 1,
            }));
            const cocokKelompok = k.nama.toLowerCase().includes(q);
            return {
              nama: k.nama,
              no: idx + 1,
              anggota:
                q && !cocokKelompok
                  ? semua.filter((a) => [a.nama, a.nip, a.jabatan].some((t) => t.toLowerCase().includes(q)))
                  : semua,
            };
          })
          .filter((k) => k.anggota.length > 0),
      }))
      .filter((p) => p.kelompok.length > 0);
  }, [pusat, cari]);

  const td = "p-2 border-r border-b border-slate-200 align-top break-words";

  return (
    <div
      className={`kr-print ${FONT} bg-white rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.10)] border border-slate-200 overflow-hidden w-full max-w-full min-w-0`}
    >
      <PrintStyles />

      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3 no-print">
        <h3 className="font-extrabold text-slate-800 text-base min-w-0">
          Kelompok Riset ORPA Tahun Anggaran 2026
          <span className="ml-2 text-xs font-semibold text-slate-500">
            {total.kelompok} kelompok · {total.periset} periset
          </span>
        </h3>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari kelompok, nama, NIP, jabatan..."
            className="w-64 max-w-full px-4 py-1.5 border border-slate-300 rounded-full text-xs focus:outline-none focus:border-[#ee2a3c] focus:ring-2 focus:ring-[#ee2a3c]/30"
          />
          <select
            value={pusat}
            onChange={(e) => setPusat(e.target.value)}
            className="px-4 py-1.5 border border-slate-300 rounded-full text-xs bg-white focus:outline-none focus:border-[#ee2a3c] focus:ring-2 focus:ring-[#ee2a3c]/30"
          >
            <option>{SEMUA}</option>
            {DATA.map((p) => (
              <option key={p.nama}>{p.nama}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => window.print()}
            className={`px-4 py-1.5 ${MERAH_BG} hover:brightness-110 text-white rounded-full text-xs font-bold shadow-md transition`}
          >
            Cetak Daftar
          </button>
        </div>
      </div>

      <table className="w-full max-w-full table-fixed text-left text-[11px] border-collapse">
        <colgroup>
          {WIDTHS.map((w, i) => (
            <col key={i} style={{ width: `${w}%` }} />
          ))}
        </colgroup>

        <thead>
          <tr className={`${MERAH_BG} text-white text-center font-extrabold`}>
            {KOLOM.map((l) => (
              <th key={l} className={`p-2.5 border-r border-white/25 last:border-r-0 ${WRAP}`}>
                {l}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {tampil.map((p) => (
            <Fragment key={p.nama}>
              <tr>
                <td
                  colSpan={KOLOM.length}
                  className={`p-2 ${MERAH_TUA_BG} text-white text-center font-extrabold uppercase tracking-wider`}
                >
                  {p.nama}
                </td>
              </tr>
              {p.kelompok.map((k) =>
                k.anggota.map((a, i) => (
                  <tr key={`${p.nama}-${k.nama}-${a.nip}`} className="hover:bg-red-50/50 transition-colors">
                    {i === 0 && (
                      <>
                        <td rowSpan={k.anggota.length} className={`${td} text-center font-bold text-slate-600 bg-white`}>
                          {k.no}.
                        </td>
                        <td rowSpan={k.anggota.length} className={`${td} font-extrabold ${MERAH_TEKS} uppercase bg-white`}>
                          {k.nama}
                        </td>
                      </>
                    )}
                    <td className={td}>
                      <span className="text-slate-400 mr-1">{a.no}.</span>
                      {a.nama}
                    </td>
                    <td className={`${td} text-center font-mono tabular-nums`}>{a.nip}</td>
                    <td className={`${td} text-center`}>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${lencana(a.keterangan)}`}
                      >
                        {a.keterangan}
                      </span>
                    </td>
                    <td className={`${td} border-r-0`}>{a.jabatan}</td>
                  </tr>
                )),
              )}
            </Fragment>
          ))}

          {tampil.length === 0 && (
            <tr>
              <td colSpan={KOLOM.length} className="p-6 text-center text-slate-500">
                Tidak ada data yang cocok dengan pencarian.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Halaman ---------- */
export default function KelompokRisetPage() {
  return (
    <div className={`mt-20 min-h-screen w-full bg-[#f4f4f4] overflow-hidden ${FONT}`} translate="no">
      <InstansiBar />
      <div className="p-6 md:p-8">
        <KelompokRisetTable />
      </div>
    </div>
  );
}