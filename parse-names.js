// based on PHP Name Parser by Josh Fraser (joshfraser.com)
// http://www.onlineaspect.com/2009/08/17/splitting-names/
// ported to JavaScript by Mark Pemburn (pemburnia.com)
// released under Apache 2.0 license

var NameParse = (function(){
	function NameParse() {
		return NameParse;
	}
	
		// split full names into the following parts:
		// - prefix / salutation  (Mr., Mrs., etc)
		// - given name / first name
		// - middle initials
		// - surname / last name 
		// - suffix (II, Phd, Jr, etc)
	NameParse.parse = function (fullastName) {
		fullastName = fullastName.trim();

		var nameParts = [];
		var lastName = "";
		var firstName = "";
        var middleName = "";
        var nickName = "";
		var word = null;
		var j = 0;
		var i = 0;

        // Check if we have nicknames.
        // Example: Dr. Juan Q. Xavier de la Vega III (Doc Vega)
        // Doc Vega is the nickname
        var nickNameIndex = fullastName.indexOf("(");
        if (nickNameIndex != -1) {
            while(nickNameIndex != -1) {
                var endIndex = fullastName.indexOf(")", nickNameIndex);
                nickName = " " + nickName + fullastName.substring(nickNameIndex + 1, endIndex);
                fullastName = this.removeCharsAt(fullastName, nickNameIndex, endIndex - nickNameIndex + 1).trim();

                nickNameIndex = fullastName.indexOf("(");
            }
        }
        nameParts = fullastName.split(" ");

		var numWords = nameParts.length;

		// is the first word a title? (Mr. Mrs, etc)
		var salutation = this.is_salutation(nameParts[0]);
		var suffix = this.is_suffix(nameParts[numWords - 1]);

		// set the range for the middle part of the name (trim prefixes & suffixes)
		var start = (salutation) ? 1 : 0;
		var end = (suffix) ? numWords - 1 : numWords;

		word = nameParts[start];

        // Get the first name
        firstName += " " + this.fix_case(word);

		// concat the first name
		for (i=start + 1; i<(end - 1); i++) {
			word = nameParts[i];
			// move on to parsing the last name if we find an indicator of a compound last name (Von, Van, etc)
			// we do not check earlier to allow for rare cases where an indicator is actually the first name (like "Von Fabella")
			if (this.is_compound_lastName(word)) {
				break;
			}

            middleName += " " + this.fix_case(word);
		}
		
		// check that we have more than 1 word in our string
		if ((end - start) > 1) {
			// concat the last name
			for (j=i; j<end; j++) {
				lastName += " " + this.fix_case(nameParts[j]);
			}
		}
	
		// return the various parts in an array
		return {
			"salutation": salutation || "",
			"firstName": firstName.trim(),
            "middleName": middleName.trim(),
			"lastName": lastName.trim(),
			"nickName": nickName.trim(),
			"suffix": suffix || ""
		};
	};

	NameParse.removeIgnoredChars = function (word) {
		//ignore periods
		return word.replace(".","");
	};

	// detect and format standard salutations 
	// I'm only considering english honorifics for now & not words like 
	NameParse.is_salutation = function (word) {
		word = this.removeIgnoredChars(word).toLowerCase();
		// returns normalized values
		if (word === "mr" || word === "master" || word === "mister") {
			return "Mr.";
		} else if (word === "mrs") {
			return "Mrs.";
		} else if (word === "miss" || word === "ms") {
			return "Ms.";
		} else if (word === "dr") {
			return "Dr.";
		} else if (word === "rev") {
			return "Rev.";
		} else if (word === "fr") {
			return "Fr.";
		} else {
			return false;
		}
	};

	//  detect and format common suffixes 
	NameParse.is_suffix = function (word) {
		word = this.removeIgnoredChars(word).toLowerCase();
		// these are some common suffixes - what am I missing?
		var suffixArray = [
            '2', 'APR', 'BVM', 'CFRE', 'CLU', 'CME', 'CPA', 'CSC', 'CSJ', 'DC', 'DD', 'DDS', 'DMD', 'DO', 'DVM', 'EdD',
            'Esq', 'I', 'II', 'III', 'IV', 'JD', 'Jr', 'Junior', 'LLD', 'MA', 'MD', 'OD', 'OSB', 'PC', 'PE', 'PhD',
            'RGS', 'RN', 'RNC', 'RPh', 'Ret', 'SHCJ', 'SJ', 'SNJM', 'SSMO', 'Senior', 'Sr', 'USA', 'USAF', 'USAFR',
            'USAR', 'USCG', 'USMC', 'USMCR', 'USN', 'USNR', 'V', 'cfp', 'chfc', 'clu', 'dds', 'dmd', 'do', 'dpm', 'esq',
            'esquire', 'i', 'ii', 'iii', 'iv', 'jnr', 'jr', 'ma', 'mba', 'md', 'mp', 'phd', 'qc', 'snr', 'sr', 'v'
        ];

		var suffixIndex = suffixArray.map(function(suffix){
			return suffix.toLowerCase();
		}).indexOf(word);

		if(suffixIndex >= 0) {
			return suffixArray[suffixIndex];
		} else {
			return false;
		}
	};

	// detect compound last names like "Von Fange"
	NameParse.is_compound_lastName = function (word) {
		word = word.toLowerCase();
		// these are some common prefixes that identify a compound last names - what am I missing?
		var words = [
            'abu', 'bin', 'bon', 'bon', 'da', 'dal', 'de', 'del', 'della', 'der', 'di', 'du', 'dí', 'ibn', 'la',
            'le', 'lo', 'pietro', 'san', 'st', 'st.', 'ste', 'ter', 'van', 'vanden', 'vel', 'vere', 'von'
        ];
		return (words.indexOf(word) >= 0);
	};

	// detect mixed case words like "McDonald"
	// returns false if the string is all one case
	NameParse.is_camel_case = function (word) {
		var ucReg = /[A-Z]+/;
		var lcReg = /[a-z]+/;
		return (ucReg.exec(word) && lcReg.exec(word));
	};

	// ucfirst words split by dashes or periods
	// ucfirst all upper/lower strings, but leave camelcase words alone
	NameParse.fix_case = function (word) {
		// uppercase words split by dashes, like "Kimura-Fay"
		word = this.safe_ucfirst("-",word);
		// uppercase words split by periods, like "J.P."
		word = this.safe_ucfirst(".",word);
		return word;
	};

	// helper for this.fix_case
	// uppercase words split by the seperator (ex. dashes or periods)
	NameParse.safe_ucfirst = function (seperator, word) {
		return word.split(seperator).map(function(thisWord){
			if(this.is_camel_case(thisWord)) {
				return thisWord;
			} else {
				return thisWord.substr(0,1).toUpperCase() + thisWord.substr(1).toLowerCase();
			}
		}, this).join(seperator);
	};

    // Helper function to replace characters in a string
	NameParse.removeCharsAt = function (word, index, charcount) {
		return word.substr(0, index) + word.substr(index + charcount);
	};

	return NameParse;
})();
