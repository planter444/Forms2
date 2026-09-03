const compareText = (left, right) => `${left}`.localeCompare(`${right}`);

export const normalizeLocationHierarchy = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(input)
      .map(([county, subCounties]) => {
        const nextCounty = `${county || ""}`.trim();

        if (!nextCounty || !subCounties || typeof subCounties !== "object" || Array.isArray(subCounties)) {
          return null;
        }

        const nextSubCounties = Object.fromEntries(
          Object.entries(subCounties)
            .map(([subCounty, wards]) => {
              const nextSubCounty = `${subCounty || ""}`.trim();
              const nextWards = Array.isArray(wards)
                ? [...new Set(wards.map((ward) => `${ward || ""}`.trim()).filter(Boolean))]
                : [];

              if (!nextSubCounty || !nextWards.length) {
                return null;
              }

              return [nextSubCounty, nextWards];
            })
            .filter(Boolean)
        );

        if (!Object.keys(nextSubCounties).length) {
          return null;
        }

        return [nextCounty, nextSubCounties];
      })
      .filter(Boolean)
  );
};

export const parseLocationHierarchyText = (input) => {
  const lines = `${input || ""}`
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const hierarchy = {};
  let currentCounty = "";

  for (const line of lines) {
    const countyMatch = line.match(/^\d+\.\s+(.+)$/);

    if (countyMatch) {
      currentCounty = countyMatch[1].trim();

      if (!currentCounty) {
        throw new Error("One of the county names is empty.");
      }

      hierarchy[currentCounty] = hierarchy[currentCounty] || {};
      continue;
    }

    const subCountyMatch = line.match(/^-\s*(.+?):\s*(.+)$/);

    if (subCountyMatch) {
      if (!currentCounty) {
        throw new Error(`Found a sub-county before any county heading: ${line}`);
      }

      const subCounty = subCountyMatch[1].trim();
      const wards = subCountyMatch[2]
        .split(",")
        .map((ward) => ward.trim())
        .filter(Boolean);

      if (!subCounty) {
        throw new Error(`A sub-county name is empty in: ${line}`);
      }

      if (!wards.length) {
        throw new Error(`No wards were found for ${subCounty}.`);
      }

      hierarchy[currentCounty][subCounty] = wards;
      continue;
    }

    throw new Error(`Could not understand this line: ${line}`);
  }

  const normalized = normalizeLocationHierarchy(hierarchy);

  if (!Object.keys(normalized).length) {
    throw new Error("No county, sub-county, and ward data was found in the text.");
  }

  return normalized;
};

export const serializeLocationHierarchy = (input) => {
  const hierarchy = normalizeLocationHierarchy(input);

  return Object.entries(hierarchy)
    .map(([county, subCounties], countyIndex) => {
      const subCountyLines = Object.entries(subCounties).map(
        ([subCounty, wards]) => `- ${subCounty}: ${wards.join(", ")}`
      );

      return [`${countyIndex + 1}. ${county}`, ...subCountyLines].join("\n");
    })
    .join("\n\n");
};

export const buildLocationHierarchyStats = (input) => {
  const hierarchy = normalizeLocationHierarchy(input);
  const counties = Object.keys(hierarchy);
  let subCountyCount = 0;
  let wardCount = 0;

  counties.forEach((county) => {
    const subCounties = Object.keys(hierarchy[county] || {});
    subCountyCount += subCounties.length;
    subCounties.forEach((subCounty) => {
      wardCount += (hierarchy[county][subCounty] || []).length;
    });
  });

  return {
    countyCount: counties.length,
    subCountyCount,
    wardCount
  };
};

export const defaultLocationHierarchyText = `1. Mombasa
- Changamwe: Port Reitz, Kipevu, Airport, Changamwe, Chaani
- Jomvu: Jomvu Kuu, Miritini, Mikindani
- Kisauni: Mjambere, Junda, Bamburi, Mwakirunge, Mtopanga, Magogoni, Shanzu
- Nyali: Frere Town, Ziwa la Ng'ombe, Kadzandani
- Likoni: Mtongwe, Shika Adabu, Bofu, Likoni, Timbwani
- Mvita: Mji wa Kale/Makadara, Tudor, Tononoka, Shimanzi/Ganjoni, Majengo

2. Kwale
- Msambweni: Gombato Bongwe, Ukunda, Kinondo, Ramisi
- Lunga Lunga: Pongwe/Kikoneni, Dzombo, Mwereni, Vanga
- Matuga: Tsimba Golini, Waa, Tiwi, Kubo South, Mkongani
- Kinango: Ndavaya, Puma, Kinango, Mackinnon Road, Chengoni/Samburu, Mwavumbo, Kasemeni

3. Kilifi
- Kilifi North: Tezo, Sokoni, Kibarani, Dabaso, Matsangoni, Watamu, Mnarani
- Kilifi South: Junju, Mwarakaya, Shimo la Tewa, Chasimba, Mtepeni
- Kaloleni: Mariakani, Kayafungo, Kaloleni, Mwanamwinga
- Rabai: Mwawesa, Ruruma, Kambe/Ribe, Rabai/Kisurutini
- Ganze: Ganze, Bamba, Jaribuni, Sokoke
- Malindi: Jilore, Kakuyuni, Ganda, Malindi Town, Shella
- Magarini: Marafa, Magarini, Gongoni, Adu, Garashi, Sabaki

4. Tana River
- Garsen: Kipini East, Garsen South, Kipini West, Garsen Central, Garsen West, Garsen North
- Galole: Kinakomba, Mikinduni, Chewani, Wayu
- Bura: Chewele, Hirimani, Bangale, Sala, Madogo

5. Lamu
- Lamu East: Faza, Kiunga, Basuba
- Lamu West: Shella, Mkomani, Hindi, Mkunumbi, Hongwe, Witu

6. Taita Taveta
- Taveta: Chala, Mahoo, Bomani, Mboghoni, Mata
- Wundanyi: Wundanyi/Mbale, Werugha, Wumingu/Kishushe, Mwanda/Mgange
- Mwatate: Rong'e, Mwatate, Bura, Chawia, Wusi/Kishamba
- Voi: Mbololo, Sagalla, Kaloleni, Marungu, Kasigau, Ngolia

7. Garissa
- Garissa Township: Waberi, Galbet, Township, Iftin
- Balambala: Balambala, Danyere, Jara Jara, Saka, Sankuri
- Lagdera: Modogashe, Benane, Goreale, Maalimin, Sabena
- Dadaab: Dertu, Dadaab, Labasigale, Damajale, Liboi, Abakaile
- Fafi: Bura, Dekaharia, Jarajila, Fafi, Nanighi
- Ijara: Hulugho, Sangailu, Ijara, Masalani

8. Wajir
- Wajir North: Gurar, Bute, Korondile, Malkagufu, Danaba, Godoma
- Wajir East: Wajir Bor, Hadado/Athibohol, Eldas, Dela, Tarbaj
- Tarbaj: Elben, Sarman, Tarbaj, Wargadud
- Wajir West: Arbajahan, Hadado, Adamasajide, Ganyure/Wagalla
- Eldas: Eldas, Della, Lakoley South/Basir, Elnur/Tula Tula

9. Mandera
- Mandera West: Takaba South, Takaba, Lagsure, Dandu, Gither
- Banissa: Banissa, Derkhale, Guba, Malkamari, Kiliwehiri
- Mandera North: Ashabito, Guticha, Morothile, Rhamu, Rhamu Dimtu
- Mandera South: Wargadud, Kutulo, Elwak South, Elwak North, Shimbir Fatuma
- Mandera East: Arabal, Bulla Mpya, Neboi, Khalalio, Township
- Lafey: Sala, Fino, Lafey, Warankara

10. Marsabit
- Moyale: Butiye, Sololo, Heillu/Manyatta, Golbo, Moyale Township, Uran, Obbu
- North Horr: Dukana, Maikona, Turbi, North Horr, Illeret
- Saku: Sagante/Jaldesa, Karare, Marsabit Central
- Laisamis: Loiyangalani, Kargi/South Horr, Korr/Ngurunit, Logo Logo, Laisamis

11. Isiolo
- Isiolo North: Wabera, Bulla Pesa, Chari, Cherab, Ngaremara
- Isiolo South: Garbatulla, Kinna, Sericho

12. Meru
- Igembe South: Maua, Kiegoi/Antubochiu, Athiru Gaiti, Akachiu
- Igembe Central: Akirang'ondu, Athiru Ruujine, Igembe East, Njia, Kangeta
- Igembe North: Antuambui, Ntunene, Antubetwe Kiongo, Naathu, Amwathi
- Tigania West: Athwana, Akithi, Kianjai, Nkomo, Mbeu
- Tigania East: Thangatha, Mikinduri, Kiguchwa, Muthara, Karama
- North Imenti: Municipality, Ntima East, Ntima West, Nyaki West, Nyaki East
- Buuri: Timau, Kisima, Kiirua/Naari, Ruiri/Rwarera
- Central Imenti: Mwanganthia, Abothuguchi Central, Abothuguchi West, Kiagu
- South Imenti: Mitunguu, Igoji East, Igoji West, Abogeta East, Abogeta West, Nkuene

13. Tharaka Nithi
- Maara: Mitheru, Muthambi, Mwimbi
- Chuka/Igambang'ombe: Chuka, Igambang'ombe, Magumoni
- Tharaka: Gatunga, Marimanti, Nkondi

14. Embu
- Manyatta: Ruguru/Ngandori, Kithimu, Nginda, Mbeti North, Kirimari, Gaturi South
- Runyenjes: Gaturi North, Kagaari South, Central Ward, Kagaari North, Kyeni North, Kyeni South
- Mbeere South: Mwea, Makima, Mbeti South, Mavuria, Kiambere
- Mbeere North: Nthawa, Muminji, Evurore

15. Kitui
- Mwingi North: Ngomeni, Kyuso, Mumoni, Tseikuru, Tharaka
- Mwingi West: Kyome/Thaana, Nguni, Nuu, Mui, Waita
- Mwingi Central: Central, Kivou, Nguni, Nuu
- Kitui West: Mutonguni, Kauwi, Matinyani, Kwa Mutonga/Kithumula
- Kitui Rural: Kisasi, Mbitini, Kwavonza/Yatta, Kanyangi
- Kitui Central: Miambani, Township, Kyangwithya West, Mulango, Kyangwithya East
- Kitui East: Zombe/Mwitika, Chuluni, Nzambani, Voo/Kyamatu, Endau/Malalani, Mutito/Kaliku

16. Machakos
- Masinga: Kivaa, Masinga Central, Ekalakala, Muthesya, Ndithini
- Yatta: Ndalani, Matuu, Kithimani, Ikombe, Katangi
- Kangundo: Kangundo North, Kangundo Central, Kangundo East, Kangundo West
- Matungulu: Tala, Matungulu North, Matungulu East, Matungulu West, Kyeleni
- Kathiani: Mitaboni, Kathiani Central, Upper Kaewa/Iveti, Lower Kaewa/Kaani
- Mavoko: Athi River, Kinanie, Muthwani, Syokimau/Mulolongo
- Machakos Town: Kalama, Mua, Mutituni, Machakos Central, Mumbuni North, Muvuti/Kiima Kimwe, Kola
- Mwala: Mbiuni, Makutano/Mwala, Masii, Muthetheni, Wamunyu, Kibauni

17. Makueni
- Mbooni: Tulimani, Mbooni, Kithungo/Kitundu, Kiteta/Kisau, Waia/Kako, Kalawa
- Kilome: Kasikeu, Mukaa, Kiima Kiu/Kalanzoni
- Kaiti: Ukia, Kee, Kilungu, Ilima
- Makueni: Wote, Muvau/Kikumini, Mavindini, Kitise/Kithuki, Kathozweni, Nzaui/Kilili/Kalamba
- Kibwezi West: Makindu, Nguumo, Kikumbulyu North, Kikumbulyu South, Nguu/Masumba
- Kibwezi East: Mtito Andei, Thange, Ivingoni/Nzambani

18. Nyandarua
- Kinangop: Engineer, Gathara, North Kinangop, Murungaru, Njabini/Kiburu
- Kipipiri: Wanjohi, Kipipiri, Geta, Githioro
- Ol Kalou: Karau, Kanjuiri Ridge, Mirangine, Kaimbaga, Rurii
- Ol Jorok: Gathanji, Gatimu, Weru, Charagita
- Ndaragwa: Leshau/Pondo, Kiriita, Central, Shamata

19. Nyeri
- Tetu: Dedan Kimathi, Wamagana, Aguthi/Gaaki
- Kieni: Mweiga, Naromoru Kiamathaga, Mwiyogo/Endarasha, Mugunda, Gatarakwa, Thegu River
- Mathira: Ruguru, Magutu, Iriaini, Konyu, Karatina Town
- Othaya: Mahiga, Iria-Ini, Chinga, Karima
- Mukurweini: Gikondi, Rugi, Muguru, Ithanga
- Nyeri Town: Rware, Gatitu/Muruguru, Ruring'u, Kamakwa/Mukaro

20. Kirinyaga
- Mwea: Mutithi, Kangai, Thiba, Wamumu, Nyanza
- Gichugu: Kabare, Baragwi, Njukiini, Ngariama, Karumandi
- Ndia: Mukure, Kiine, Kariti
- Kirinyaga Central: Mutira, Kangai, Kanyekini, Kerugoya/Kutus

21. Murang'a
- Kigumo: Kangari, Kinyona, Kigumo, Kahumbu, Muthithi
- Kandara: Ng'araria, Muruka, Kandara, Gaichanjiru, Ithiru
- Kiharu: Wangu, Mugoiri, Mbiri, Town, Kimathi
- Mathioya: Gitugi, Kiru, Kamacharia
- Gatanga: Ithanga, Kakuzi/Mitubiri, Mugumo-ini, Kihumbu-ini, Gatura, Kariara
- Maragwa: Kamahuha, Kimorori/Wempa, Makuyu, Kambiti, Maragwa Town

22. Kiambu
- Gatundu South: Kiamwangi, Kiganjo, Ndarugo, Ngenda
- Gatundu North: Gituamba, Githobokoni, Chania, Mang'u
- Juja: Murera, Theta, Juja, Witeithie, Kalimoni
- Thika Town: Township, Kamenu, Hospital, Gatuanyaga, Ngoliba
- Ruiru: Gitothua, Biashara, Gatongora, Kahawa Sukari, Kahawa Wendani, Kiuu, Mwiki, Mwihoko
- Githunguri: Githunguri, Githiga, Ikinu, Ngewa, Komothai
- Kiambu: Ting'ang'a, Ndumberi, Riabai, Town
- Kiambaa: Cianda, Karuri, Ndenderu, Muchatha, Kihara
- Kabete: Gitaru, Muguga, Nyadhuna, Kabete, Uthiru
- Kikuyu: Kinoo, Kikuyu, Sigona, Karai, Nachu
- Limuru: Limuru Central, Tigoni, Ndeiya, Limuru East, Ngecha/Tigoni
- Lari: Kinale, Kijabe, Nyanduma, Kamburu, Lari/Kirenga

23. Turkana
- Turkana North: Kaeris, Lake Zone, Lapur, Kaaleng/Kaikor, Kibish
- Turkana West: Kakuma, Lopur, Letea, Songot, Kalobeyei
- Turkana Central: Kerio Delta, Kang'atotha, Kalokol, Lodwar Township, Kanamkemer
- Loima: Loima, Turkwel, Lokiriama/Lorengippi
- Turkana South: Katilu, Lobokat, Kalapata, Lokichar
- Turkana East: Kapedo/Napeitom, Katilia, Lokori/Kochodin

24. West Pokot
- Kapenguria: Riwo, Kapenguria, Mnagei, Siyoi, Endugh, Sook
- Sigor: Sekerr, Masool, Lomut, Weiwei
- Kacheliba: Suam, Kodich, Kapchok, Kasei, Kiwawa, Alale
- Pokot South: Chepareria, Batei, Lelan, Tapach

25. Samburu
- Samburu West: Lodokejek, Suguta Marmar, Maralal, Loosuk, Poro
- Samburu North: El Barta, Nachola, Ndoto, Nyiro, Angata Nanyokie, Baawa
- Samburu East: Waso, Wamba West, Wamba East, Wamba North

26. Trans Nzoia
- Kwanza: Kapomboi, Kwanza, Keiyo, Bidii
- Endebess: Chepchoina, Endebess, Matumbei
- Saboti: Kinyoro, Matisi, Tuwani, Saboti, Machewa
- Kiminini: Kiminini, Waitaluk, Sirende, Hospital, Sinyerere
- Cherangany: Sitatunga, Makutano, Kaplamai, Motosiet, Cherangany/Suwerwa

27. Uasin Gishu
- Soy: Moi's Bridge, Kapkures, Ziwa, Segero/Barsombe, Kipsomba, Soy, Kuinet/Kapsuswa
- Turbo: Ngenyilel, Tapsagoi, Kamagut, Kiplombe, Huruma
- Moiben: Tembelio, Sergoit, Karuna/Meibeki, Moiben, Kimumu
- Ainabkoi: Kapsoya, Kaptagat, Ainabkoi/Olare
- Kapseret: Simat/Kapseret, Kipkenyo, Ngeria
- Kesses: Racecourse, Cheptiret/Kipchamo, Tulwet/Chuiyat

28. Elgeyo Marakwet
- Marakwet East: Kapyego, Sambirir, Endo
- Marakwet West: Arror, Emsoo, Lelan, Sengwer
- Keiyo North: Tambach, Kamariny, Kapchemutwa, Keiyo North
- Keiyo South: Kaptarakwa, Chepkorio, Soy North, Soy South

29. Nandi
- Tinderet: Songhor/Soba, Tinderet, Chemelil/Chemase, Kibwareng
- Aldai: Kabwareng, Terik, Kemeloi/Maraba, Kobujoi, Kaptumo/Kaboi, Koyo/Ndurio
- Nandi Hills: Nandi Hills, Chepkunyuk, Ol'lessos, Kapchorua
- Chesumei: Chemundu/Kapng'etuny, Kosirai, Lelwak, Chepterwai
- Emgwen: Kapsabet, Kilibwoni, Chepkumia, Kamoiywo
- Mosop: Chepterit/Kipchamo, Kurgung/Surungai, Kabiyet, Ndalat, Kabisaga, Sangalo/Kebulonik

30. Baringo
- Tiaty: Tirioko, Kolowa, Ribkwo, Silale, Loiyamorock, Tangulbei/Korossi
- Baringo North: Barwessa, Kabartonjo, Saimo/Kipsaraman, Saimo/Soi, Bartabwa
- Baringo Central: Kabarnet, Sacho, Tenges, Ewalel/Chapchap, Kapropita
- Baringo South: Marigat, Ilchamus, Mochongoi, Mukutani
- Mogotio: Mogotio, Emining
- Eldama Ravine: Lembus, Lembus Kwen, Ravine, Mumberes/Maji Mazuri, Lembus/Pekerra

31. Laikipia
- Laikipia West: Ol Moran, Rumuruti Township, Githiga
- Laikipia East: Ngobit, Tigithi, Thingithu, Nanyuki
- Laikipia North: Sosian, Segera, Mukogodo East, Mukogodo West

32. Nakuru
- Naivasha: Biashara, Hells Gate, Lake View, Maiella, Mai Mahiu, Olkaria, Naivasha East
- Gilgil: Gilgil, Elementaita, Mbaruk/Eburu, Malewa West
- Kuresoi South: Amalo, Keringet, Kiptagich, Tinet
- Kuresoi North: Kiptororo, Nyota, Sirikwa, Kamara
- Subukia: Subukia, Waseges, Kabazi
- Rongai: Menengai West, Soin, Visoi, Mosop, Solai
- Bahati: Dundori, Kiamaina, Lanet/Umoja, Bahati
- Nakuru Town West: Kaptembwa, Rhoda, Shabaab, Kapkures, Barut
- Nakuru Town East: Biashara, Flamingo, Kivumbini, Nakuru East

33. Narok
- Kilgoris: Kilgoris Central, Keyian, Angata Barikoi, Shankoe
- Emurua Dikirr: Ilkerin, Ololmasani, Mogondo, Kapsasian
- Narok North: Olposimoru, Olokurto, Narok Town, Nkareta, Olorropil
- Narok East: Mosiro, Ildamat, Keekonyokie, Suswa
- Narok South: Majimoto/Naroosura, Ololulung'a, Melelo, Loita, Sogoo
- Narok West: Ilmotiok, Mara, Siana, Naikarra

34. Kajiado
- Kajiado North: Ongata Rongai, Nkaimurunya, Olkeri, Oloolua, Ngong
- Kajiado Central: Purko, Ildamat, Dalalekutuk, Matapato North, Matapato South
- Kajiado East: Kitengela, Oloosirkon/Sholinke, Kenyawa/Poka, Imaroro
- Kajiado West: Keekonyokie, Iloodokilani, Magadi, Ewuaso Oonkidong'i
- Kajiado South: Entonet/Lenkisim, Mbirikani/Eselenkei, Kuku, Rombo

35. Kericho
- Kipkelion East: Londiani, Kamasian, Kipkelion, Chilchila
- Kipkelion West: Kunyak, Kamasian, Kipkelion West, Chilchila
- Ainamoi: Kapsoit, Ainamoi, Kipchebor, Kapkugerwet, Kipchimchim
- Bureti: Litein, Cheplanget, Kapkatet, Cheboin
- Belgut: Waldai, Kabianga, Cheptororiet, Chaik
- Sigowet/Soin: Sigowet, Kaplelartet, Soliat

36. Bomet
- Sotik: Ndanai/Abosi, Chemagel, Kipsonoi, Rongena/Manaret
- Chepalungu: Kong'asis, Nyangores, Sigor, Chebunyo, Siongiroi
- Bomet East: Merigi, Kembu, Longisa, Kipreres, Chemaner
- Bomet Central: Silibwet Township, Ndaraweta, Singorwet, Chesoen, Mutarakwa
- Konoin: Chepchabas, Kimulot, Mogogosiek, Boito, Embomos

37. Kakamega
- Lugari: Mautuma, Lwandeti, Lugari, Lumakanda, Chekalini
- Likuyani: Likuyani, Sango, Kongoni, Nzoia
- Malava: West Kabras, Chemuche, East Kabras, Butali/Chegulo, Manda-Shivanga
- Lurambi: Butsotso East, Butsotso South, Butsotso Central, Sheywe, Mahiakalo
- Navakholo: Ingotse/Matiha, Shinoyi/Shikomari/Esumeyia, Bunyala West, Bunyala East
- Mumias West: Mumias Central, Mumias North, Etenje, Musanda
- Mumias East: Lubinu/Lusheya, Isongo/Makunga, East Wanga
- Matungu: Koyonzo, Kholera, Khalaba, Mayoni, Namamali
- Butere: Marama West, Marama Central, Marama North, Marama South
- Khwisero: Kisa North, Kisa East, Kisa West, Kisa Central
- Shinyalu: Isukha North, Isukha East, Isukha Central, Isukha South, Isukha West
- Ikolomani: Idakho South, Idakho East, Idakho North, Idakho Central

38. Vihiga
- Vihiga: Lugaga/Wamuluma, South Maragoli, Central Maragoli, Mungoma
- Sabatia: Lyaduywa/Izava, West Sabatia, Chavakali, North Maragoli, Wodanga, Busali
- Hamisi: Shiru, Gisambai, Shamakhokho, Banja, Muhudu
- Emuhaya: North East Bunyore, Central Bunyore, West Bunyore

39. Bungoma
- Mt Elgon: Cheptais, Chesikaki, Chepyuk, Kaptama, Elgon
- Sirisia: Namwela, Malakisi/South Kulisiru, Lwandanyi
- Kabuchai: Kabuchai/Chwele, West Nalondo, Bwake/Luuya
- Bumula: Bumula, Khasoko, Kabula, Kimaeti, South Bukusu
- Kanduyi: Bukembe West, Bukembe East, Township, Khalaba, Musikoma, East Sang'alo
- Webuye East: Mihuu, Ndivisi, Maraka
- Webuye West: Misikhu, Bokoli, Matulo
- Kimilili: Kimilili, Kibingei, Maeni, Kamukuywa
- Tongaren: Milima, Naitiri/Kabuyefwe, Soysambu/Mitua, Tongaren, Ndalu/Tabani

40. Busia
- Teso North: Malaba Central, Malaba North, Ang'urai South, Ang'urai North, Ang'urai East
- Teso South: Ang'orom, Chakol South, Chakol North, Amukura West, Amukura East, Amukura Central
- Nambale: Nambale Township, Bukhayo North/Waltsi, Bukhayo East
- Matayos: Bukhayo West, Mayenje, Matayos South, Busibwabo
- Butula: Marachi West, Kingandole, Marachi Central, Marachi East, Marachi North
- Funyula: Nangina, Ageng'a Nanguba, Bwiri
- Budalangi: Bunyala Central, Bunyala North, Bunyala South, Bunyala West

41. Siaya
- Ugenya: West Ugenya, Ukwala, North Ugenya, East Ugenya
- Ugunja: Sidindi, Sigomere, Ugunja
- Alego Usonga: Usonga, West Alego, Central Alego, Siaya Township, North Alego, South East Alego
- Gem: North Gem, West Gem, Central Gem, Yala Township, East Gem, South Gem
- Bondo: West Yimbo, Central Sakwa, South Sakwa, Yimbo West, Yimbo East, North Sakwa
- Rarieda: East Asembo, West Asembo, North Uyoma, South Uyoma

42. Kisumu
- Kisumu East: Kajulu, Kolwa East, Manyatta B, Nyalenda A, Nyalenda B
- Kisumu West: South West Kisumu, Central Kisumu, Kisumu North, West Kisumu, North West Kisumu
- Kisumu Central: Railways, Migosi, Shaurimoyo Kaloleni, Market Milimani, Kondele
- Seme: West Seme, Central Seme, East Seme, North Seme
- Nyando: East Kano/Wawidhi, Awasi/Onjiko, Ahero, Kabonyo/Kanyagwal, Kobura
- Muhoroni: Miwani, Ombeyi, Masogo/Nyang'oma, Chemelil, Muhoroni/Koru
- Nyakach: South West Nyakach, North Nyakach, Central Nyakach, West Nyakach, South East Nyakach

43. Homa Bay
- Kasipul: West Kasipul, South Kasipul, Central Kasipul, East Kamagak, West Kamagak
- Kabondo Kasipul: Kabondo East, Kabondo West, Kakelo/Kojwach
- Karachuonyo: West Karachuonyo, North Karachuonyo, Central, Kanyaluo, Kibiri, Wangchieng, Kendu Bay Town
- Rangwe: West Rangwe, East Rangwe, Kagan, Kochia
- Homa Bay Town: Homa Bay Central, Homa Bay Arujo, Homa Bay West
- Ndhiwa: Kwabwai, Kanyadoto, Kanyikela, Kabuoch North, Kabuoch South/Pala, Kanyamwa Kologi
- Mbita: Mfangano Island, Rusinga Island, Kasgunga, Gembe, Lambwe

44. Migori
- Rongo: North Kamagambo, Central Kamagambo, East Kamagambo, South Kamagambo
- Awendo: North Sakwa, South Sakwa, West Sakwa, Central Sakwa
- Suna East: God Jope, Suna Central, Kakrao, Kwa
- Suna West: Wiga, Wasweta I, Wasweta II, Ragana/Oruba
- Uriri: West Kanyamkago, North Kanyamkago, Central Kanyamkago, South Kanyamkago, East Kanyamkago
- Nyatike: Kachien'g, Kanyasa, North Kadem, Macalder/Kanyarwanda, Kaler, Got Kachola, Muhuru
- Kuria West: Bukira East, Bukira Central, Isibania, Makerero, Masaba, Tagare, Nyamosense/Komosoko
- Kuria East: Gokeharaka/Getambwega, Ntimaru West, Ntimaru East, Nyabasi East, Nyabasi West

45. Kisii
- Bonchari: Bomariba, Bogiakumu, Bomorenda
- South Mugirango: Tabaka, Boikanga, Bogetenga, Borabu/Chitago, Moticho, Getenga
- Bomachoge Borabu: Boochi Borabu, Bokimonge, Magenche
- Bobasi: Masige West, Masige East, Basi Central, Nyacheki, Basi West, Basi East
- Bomachoge Chache: Marani, Kiamokama, Gesusu
- Nyaribari Masaba: Ichuni, Nyamasibi, Masimba, Gesusu, Kiamokama
- Nyaribari Chache: Bobaracho, Kisii Central, Keumbu, Kiogoro, Birongo
- Kitutu Chache North: Monari, Sensi, Marani, Kegogi, Bogusero
- Kitutu Chache South: Bogeka, Nyakoe, Kitutu Central, Nyatieko, Bogeka

46. Nyamira
- Kitutu Masaba: Rigoma, Gachuba, Kemera, Magombo, Manga
- West Mugirango: Nyamaiya, Bogichora, Bosamaro, Bonyamatuta, Township
- North Mugirango: Itibo, Bomwagamo, Bokeira, Magwagwa, Ekerenyo
- Borabu: Mekenene, Kiabonyoru, Nyansiongo, Esise

47. Nairobi
- Westlands: Kitisuru, Parklands/Highridge, Karura, Kangemi, Mountain View
- Dagoretti North: Kilimani, Kawangware, Gatina, Kileleshwa, Kabiro
- Dagoretti South: Mutuini, Ngando, Riruta, Uthiru/Ruthimitu, Waithaka
- Lang'ata: Karen, Nairobi West, Nyayo Highrise, South C, Mugumo-ini
- Kibra: Lindi, Makina, Woodley/Kenyatta Golf Course, Sarang'ombe
- Roysambu: Githurai, Kahawa West, Zimmerman, Roysambu, Kahawa
- Kasarani: Clay City, Mwiki, Kasarani, Njiru, Ruai
- Ruaraka: Baba Dogo, Utalii, Mathare North, Lucky Summer, Korogocho
- Embakasi South: Imara Daima, Kwa Njenga, Kwa Reuben, Pipeline, Kware
- Embakasi North: Kariobangi North, Dandora Area I, Dandora Area II, Dandora Area III, Dandora Area IV
- Embakasi Central: Kayole North, Kayole Central, Kayole South, Komarock, Matopeni/Spring Valley
- Embakasi East: Upper Savanna, Lower Savanna, Embakasi, Utawala, Mihango
- Embakasi West: Umoja I, Umoja II, Mowlem, Kariobangi South
- Makadara: Viwandani, Harambee, Makongeni, Pumwani, Eastleigh North, Eastleigh South
- Kamukunji: Pumwani, Eastleigh North, Eastleigh South, Airbase, California
- Starehe: Nairobi Central, Ngara, Pangani, Ziwani/Kariokor, Landimawe, Nairobi South
- Mathare: Hospital, Mabatini, Huruma, Ngei, Mlango Kubwa, Kiamaiko`;

export const defaultLocationHierarchy = parseLocationHierarchyText(defaultLocationHierarchyText);

export const getCountyPreviewRows = (input, limit = 8) => {
  const hierarchy = normalizeLocationHierarchy(input);

  return Object.entries(hierarchy)
    .slice(0, limit)
    .map(([county, subCounties]) => {
      const wards = Object.values(subCounties).reduce((count, items) => count + items.length, 0);

      return {
        county,
        subCountyCount: Object.keys(subCounties).length,
        wardCount: wards,
        firstSubCounties: Object.keys(subCounties).sort(compareText).slice(0, 3)
      };
    });
};
