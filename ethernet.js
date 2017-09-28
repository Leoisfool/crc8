var polynomial = "CRC8"; //crc
var LLC; //数据部分
var from; //原MAC地址
var to; //目的MAC地址
var len; //长度字段
var unprocessed; //还没有被处理的数据
var checksum;    //计算出的校验和
var frame; //封装后的帧
var arr = new Array(); //查询表
//生成查询表
function create_crc_table() {
    var i;
    var j;
    var crc;

    for (i = 0; i <= 0xFF; i++) {
        j = i & 0xFF;
        //crc = cal_table_high_first (j).toString(16).substr(-2);
        crc = cal_table_high_first(j);
        arr[i] = crc;
    }
}
//计算crc的原始代码
function cal_table_high_first(value) {
    var i;
    var crc;

    crc = value & 0xff;
    /* 数据往左移了8位，需要计算8次 */
    for (i = 8; i > 0; --i) {
        if (crc & 0x80) /* 判断最高位是否为1 */ {
            /* 最高位为1，不需要异或，往左移一位，然后与0x31异或 */
            /* 0x31(多项式：x8+x5+x4+1，100110001)，最高位不需要异或，直接去掉 */
            crc = (crc << 1) ^ 0x07;
        } else {
            /* 最高位为0时，不需要异或，整体数据往左移一位 */
            crc = (crc << 1);
        }
        crc = crc & 0xff; //约束数字为8位整数，除前八位以外，其余的位数置零
    }

    return crc;
}
//计算出最终的checksum,注意输入的字符串需要每个字节间加空格,在本文件中已经被calculate代替
function get_crc(byte_array) {
    var c = 0x0;  //最开始让crc为0
    byte_array = byte_array.split(" ") ;//将字符串转变为数组

    for (var i = 0; i < byte_array.length; i++) {
        byte_array[i] = byte_array[i] & 0xFF;
        c = this.arr[(c ^ byte_array[i]) % 256];
    }
    //console.log("c="+c.toString(16))
    return c;
}
//生成多项式
var shengcheng = new Vue({
    el: '#selectCrc',
    data: {
        items: [{
                text: 'CRC8'
            },
            {
                text: 'CRC-CCITT'
            },
            {
                text: 'CRC16'
            },
            {
                text: 'CRC12'
            }
        ],
        selected: 'CRC8',
        showSelected: false
    },
    methods: {
        crcFunction: function () {
            polynomial = this.selected;
        }
    }
});
//获取数据
var DATA = new Vue({
    el: '#dataPart',
    data: {
        gainData: '',
        showData: false
    },
    methods: {
        gainDataFunction: function () {
            var len1
            //判断字符串位数是否为奇数，如果是，则前面加0，长度加1
            if(String(this.gainData.length/2.0).indexOf(".")>-1){
                len = (this.gainData.length / 2+1)&0xFF
                len1 = len
            }else{
               len = (this.gainData.length / 2)&0xFF
               len1 = len
            }

            len = len.toString(16)
            len1 = len
            //填充长度字段部分，让其为2个字节
            var lenLength = len.length 
            while ( lenLength< 4) {
                len = "0" + len
                lenLength++
            }

            LLC = this.gainData
            while (len1 < 91) {
                LLC += "0"
                len1++
            }
            // LLC=parseInt(this.gainData,'16')
        }
    }
});

//获取原MAC地址
var FROMMAC = new Vue({
    el: '#fromMac',
    data: {
        fMMsg: "",
        showFrom: false
    },
    methods: {
        gainMACFunction: function () {
            from = this.fMMsg
        }
    }
})
//获取目的MAC地址
var TOMAC = new Vue({
    el: '#toMac',
    data: {
        tMMsg: "",
        showTo: false
    },
    methods: {
        toMacFunction: function () {
            to = this.tMMsg
        }
    }
})
//计算
var calculation = new Vue({
    el: '#calculate1',
    data: {
        message: "这里是运算进程！"
    },
    methods: {
        calculate: function () {
            create_crc_table() //生成表
            
            console.log("查询表已生成，如下：")
            console.log(arr)

            //将原MAC地址、目的MAC地址、数据长度、数据字段链接起来并且左移8位（只是在字符串后面加两个0）
            unprocessed = from + to + len + LLC + "00" 
            //console.log("待计算的字符串为："+unprocessed)
            this.message+="待计算字符串为："+unprocessed+"\n"

            //新建一个数组，将字符串变为每两个字符一起的数组
            var myarr1 = new Array(); //用于存放生成的单个字符的数组
            var myarr2 = new Array(); //用于存放生成的每两个字符一组的数组   

            myarr1 = unprocessed.split("")

            for(var i=0,j=0;i<myarr1.length;i+=2,j++){
                myarr2[j] = parseInt(myarr1[i]+myarr1[i+1],16) //转换为十进制
            }
            this.message+="将字符串转变为数组\n"
            var byte_array = myarr2.join(" ") //将数组变为字符串传给函数

            //get_crc(byte_array)
            var c = 0x00;
            this.message+="开始通过查表法计算crc\n"
            for (var i = 0; i < myarr2.length; i++) {
                myarr2[i] = myarr2[i] & 0xFF;
                c = arr[(c ^ myarr2[i]) % 256];
            }
            this.message+="得到CRC为："+c+"\n"
            checksum = c.toString(16);
            //console.log("c="+c.toString(16))
            this.message+="开始封装成帧\n"
            frame = "0xaaaaaaaaaaaaaaab" + unprocessed.toString(16)+"000000"+checksum

            document.getElementById("fcs").value= checksum;
            document.getElementById("processed").value=frame;
            this.message+="全部完成\n"

            //this.message="查询表已生成，如下：\n";
            //this.message+=arr+"\n"
        }
    }
})