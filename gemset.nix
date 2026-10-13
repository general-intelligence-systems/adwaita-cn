{
  addressable = {
    dependencies = ["public_suffix"];
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1by7h2lwziiblizpd5yx87jsq8ppdhzvwf08ga34wzqgcv1nmpvz";
      type = "gem";
    };
    version = "2.9.0";
  };
  adwaita = {
    dependencies = ["gtk4" "rake"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1s6fdw4dri5z0nrz86dkhcgx73z5fp20pr5x34wkm7cwgc3is9q9";
      type = "gem";
    };
    version = "4.3.9";
  };
  ast = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "10yknjyn0728gjn6b5syynvrvrwm66bhssbxq8mkhshxghaiailm";
      type = "gem";
    };
    version = "2.4.3";
  };
  atk = {
    dependencies = ["glib2" "rake"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0s9lxaz66x45mkc1zac8bhi6q9lca73hwk0jjsha6ihmvkjkpm7n";
      type = "gem";
    };
    version = "4.3.9";
  };
  base64 = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0yx9yn47a8lkfcjmigk79fykxvr80r4m1i35q82sxzynpbm7lcr7";
      type = "gem";
    };
    version = "0.3.0";
  };
  cairo = {
    dependencies = ["pkg-config" "red-colors"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "08x6f2idyfnylq0b66mqi8lf5mjvff2y2q02n5hq0x4i3ha5cwz5";
      type = "gem";
    };
    version = "1.18.5";
  };
  cairo-gobject = {
    dependencies = ["cairo" "glib2"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1j45dmxyjr3cpjgm2cfmlv4a0qaw67ivi4b6863xv3l928c974zh";
      type = "gem";
    };
    version = "4.3.9";
  };
  concurrent-ruby = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1qfi2ns3zwkgq616fc127xiqhan7g7m7gqpwriwcr34nds1vxwdj";
      type = "gem";
    };
    version = "1.3.8";
  };
  ferrum = {
    dependencies = ["addressable" "base64" "concurrent-ruby" "websocket-driver"];
    groups = ["development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1inpi750jjbjlhqcf414jfx966zc6i5j3sc7y1sivz2jwcbbxf2c";
      type = "gem";
    };
    version = "0.18.0";
  };
  fiddle = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1vifygrkw22gcd4wzh8gc4pv6h1zpk6kll6mmprrf5174wvfxa3z";
      type = "gem";
    };
    version = "1.1.8";
  };
  gdk4 = {
    dependencies = ["cairo-gobject" "gdk_pixbuf2" "pango" "rake"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0jwd1j0bnprcdy3fpn3jr0wx8bvqimir1k31asjd52qlmm886ar3";
      type = "gem";
    };
    version = "4.3.9";
  };
  gdk_pixbuf2 = {
    dependencies = ["gio2" "rake"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1g1wdf0vcqlzn3a0bw47v59rl292pk8ra61mdgpxrm773nrg4y0v";
      type = "gem";
    };
    version = "4.3.9";
  };
  gio2 = {
    dependencies = ["fiddle" "gobject-introspection"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1k0azkgnlc7jim5ms2zb39a94qzlvjcaa77xzhr07cmy0pnbmp3d";
      type = "gem";
    };
    version = "4.3.9";
  };
  glib2 = {
    dependencies = ["native-package-installer" "pkg-config"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1ka9jmipfa1adf47l8831mflmjz20chiybz6z4s5wbl1gr2dph9j";
      type = "gem";
    };
    version = "4.3.9";
  };
  gobject-introspection = {
    dependencies = ["glib2"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0sympmqqfh9hcfc2hiig0c5raiiaz1r33si87xl73cczp5lhx72h";
      type = "gem";
    };
    version = "4.3.9";
  };
  graphene1 = {
    dependencies = ["gobject-introspection"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "01cc5igxiy9drr0di3pxwy3dgmck4k9wxrypnnfll945rxxypfiy";
      type = "gem";
    };
    version = "4.3.9";
  };
  gsk4 = {
    dependencies = ["gdk4" "graphene1"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "19if1cc2lkk5jcndg8iwcfs4s9gz0p3nim03lp0s53y03q7mc7wg";
      type = "gem";
    };
    version = "4.3.9";
  };
  gtk4 = {
    dependencies = ["atk" "gdk4" "gsk4"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0fs57vyk1wwn9qk0icrhsiafy4j64m3j0mcicqz71vs7wd19ax1y";
      type = "gem";
    };
    version = "4.3.9";
  };
  json = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1pqrpn0wkxvhcrwm4i0z9ailjj7if45zkkih0hij2k1q25xpwvcf";
      type = "gem";
    };
    version = "3.0.2";
  };
  language_server-protocol = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1w5p8c2145lmqzr25bxh4ikzjm6k8y1k5lriqqdpw9pq730w1wjy";
      type = "gem";
    };
    version = "3.17.0.6";
  };
  lint_roller = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "11yc0d84hsnlvx8cpk4cbj6a4dz9pk0r1k29p0n1fz9acddq831c";
      type = "gem";
    };
    version = "1.1.0";
  };
  matrix = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0nscas3a4mmrp1rc07cdjlbbpb2rydkindmbj3v3z5y1viyspmd0";
      type = "gem";
    };
    version = "0.4.3";
  };
  native-package-installer = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0bvr9q7qwbmg9jfg85r1i5l7d0yxlgp0l2jg62j921vm49mipd7v";
      type = "gem";
    };
    version = "1.1.9";
  };
  pango = {
    dependencies = ["cairo-gobject" "gobject-introspection"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "163scygydszb5njajq97h2bxa793jiwwi9pnsy9ddwy7vqx04yqz";
      type = "gem";
    };
    version = "4.3.9";
  };
  parallel = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0vvs2sar7wnw70j1jc1kv1k23m5grc0ci3bbrcf6mkh18683wnpp";
      type = "gem";
    };
    version = "2.3.0";
  };
  parser = {
    dependencies = ["ast" "racc"];
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0a4q5h2hcihk79dbr20scgkm56l79qp7fsvfvkxlv8nmapvxg9i1";
      type = "gem";
    };
    version = "3.3.12.0";
  };
  pkg-config = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0cy75ssbwjzi9z3zwfx2zq3b8xvpy9rbdf1rnhi3v612acfgiy9k";
      type = "gem";
    };
    version = "1.6.5";
  };
  prism = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "11ggfikcs1lv17nhmhqyyp6z8nq5pkfcj6a904047hljkxm0qlvv";
      type = "gem";
    };
    version = "1.9.0";
  };
  public_suffix = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "08znfv30pxmdkjyihvbjqbvv874dj3nybmmyscl958dy3f7v12qs";
      type = "gem";
    };
    version = "7.0.5";
  };
  racc = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0byn0c9nkahsl93y9ln5bysq4j31q8xkf2ws42swighxd4lnjzsa";
      type = "gem";
    };
    version = "1.8.1";
  };
  rainbow = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0smwg4mii0fm38pyb5fddbmrdpifwv22zv3d3px2xx497am93503";
      type = "gem";
    };
    version = "3.1.1";
  };
  rake = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "009p524zl0p0kfa65nii8wdmaigkmawv9pbvlcffky7islmmp0nb";
      type = "gem";
    };
    version = "13.4.2";
  };
  red-colors = {
    dependencies = ["json" "matrix"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "06ddk6dr7h3w3qvz18795md3nbh2c52bm1bl8vz3ac44s41zccqa";
      type = "gem";
    };
    version = "0.5.0";
  };
  regexp_parser = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0jxl6c5cagjz5i5n9jplhdy2izad6wapmwgfhqggb22nqfvvdvas";
      type = "gem";
    };
    version = "2.13.1";
  };
  rexml = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0hninnbvqd2pn40h863lbrn9p11gvdxp928izkag5ysx8b1s5q0r";
      type = "gem";
    };
    version = "3.4.4";
  };
  rubocop = {
    dependencies = ["json" "language_server-protocol" "lint_roller" "parallel" "parser" "rainbow" "regexp_parser" "rubocop-ast" "ruby-progressbar" "unicode-display_width"];
    groups = ["development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1q2nih91fjbv6j1qqxfhlc480zyhz94rniyh469vsw1fzd0q1xia";
      type = "gem";
    };
    version = "1.92.0";
  };
  rubocop-ast = {
    dependencies = ["parser" "prism"];
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1nw84xk6vc2ls8sxqvyhxs2agh4l0jrws85d4bi3x0501lq8ijmr";
      type = "gem";
    };
    version = "1.50.0";
  };
  rubocop-socketry = {
    dependencies = ["lint_roller" "rubocop"];
    groups = ["development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1m2bppnrzz1h9vl7xmk42pwq7znyhlv9ixds8vhhpan1x1sfbkjy";
      type = "gem";
    };
    version = "0.11.1";
  };
  ruby-progressbar = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0cwvyb7j47m7wihpfaq7rc47zwwx9k4v7iqd9s1xch5nm53rrz40";
      type = "gem";
    };
    version = "1.13.0";
  };
  unicode-display_width = {
    dependencies = ["unicode-emoji"];
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "04xnl0zwpjjvxipd6rdnxkm11pfhbhhi3179yzv51nqi9dmacyjb";
      type = "gem";
    };
    version = "3.3.0";
  };
  unicode-emoji = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1kp89lja8ii7l6f0bq5vdxq1p3kxr3a2qmmhdc38qdwh6akjzh0i";
      type = "gem";
    };
    version = "4.3.0";
  };
  webrick = {
    groups = ["development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0ca1hr2rxrfw7s613rp4r4bxb454i3ylzniv9b9gxpklqigs3d5y";
      type = "gem";
    };
    version = "1.9.2";
  };
  websocket-driver = {
    dependencies = ["base64" "websocket-extensions"];
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0ij19k6034x0c4hw0ywa7wnk5s912r8aq0hhjss10d5z36q5dicp";
      type = "gem";
    };
    version = "0.8.2";
  };
  websocket-extensions = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0hc2g9qps8lmhibl5baa91b4qx8wqw872rgwagml78ydj8qacsqw";
      type = "gem";
    };
    version = "0.1.5";
  };
}
