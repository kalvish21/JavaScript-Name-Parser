// based on PHP Name Parser by Josh Fraser (joshfraser.com)
// http://www.onlineaspect.com/2009/08/17/splitting-names/
// ported to JavaScript by Mark Pemburn (pemburnia.com)
// released under Apache 2.0 license

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/gm, '');
  };
}
String.prototype.ucfirst = function() {
    return this.substr(0,1).toUpperCase() + this.substr(1,this.length - 1).toLowerCase();
};

function NameParse() {}
	
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
	var initials = "";
	var j = 0;
	var i = 0;

	// split into words
	// completely ignore any words in parentheses
	nameParts = fullastName.split(" ").filter(function(namePart){
		return (namePart.indexOf("(") === -1);
	});

	var numWords = nameParts.length;
	// is the first word a title? (Mr. Mrs, etc)
	var salutation = this.is_salutation(nameParts[0]);
	var suffix = this.is_suffix(nameParts[nameParts.length - 1]);
	// set the range for the middle part of the name (trim prefixes & suffixes)
	var start = (salutation) ? 1 : 0;
	var end = (suffix) ? numWords - 1 : numWords;

	// concat the first name
	for (i=start; i<(end - 1); i++) {
		word = nameParts[i];
		// move on to parsing the last name if we find an indicator of a compound last name (Von, Van, etc)
		// we use i != start to allow for rare cases where an indicator is actually the first name (like "Von Fabella")
		if (this.is_compound_lastName(word) && i != start) {
			break;
		}
		// is it a middle initial or part of their first name?
		// if we start off with an initial, we'll call it the first name
		if (this.is_initial(word)) {
			// is the initial the first word?  
			if (i == start) {
				// if so, do a look-ahead to see if they go by their middle name 
				// for ex: "R. Jason Smith" => "Jason Smith" & "R." is stored as an initial
				// but "R. J. Smith" => "R. Smith" and "J." is stored as an initial
				if (this.is_initial(nameParts[i + 1])) {
					firstName += " " +  word.toUpperCase();
				} else {
					initials += " " +  word.toUpperCase();
				}
			// otherwise, just go ahead and save the initial
			} else {
				initials += " " +  word.toUpperCase(); 
			}
		} else {
			firstName += " " + this.fix_case(word);
		}   
	}
		
	// check that we have more than 1 word in our string
	if ((end - start) > 1) {
		// concat the last name
		for (j=i; j<end; j++) {
			lastName += " " + this.fix_case(nameParts[j]);
		}
	} else {
		// otherwise, single word strings are assumed to be first names
		firstName = this.fix_case(nameParts[i]);
	}
	
	// return the various parts in an array
	return {
		"salutation": salutation || "",
		"firstName": firstName.trim(),
		"initials": initials.trim(),
		"lastName": lastName.trim(),
		"suffix": suffix || ""
	};
};

// detect and format standard salutations 
// I'm only considering english honorifics for now & not words like 
NameParse.is_salutation = function (word) {
	// ignore periods
	word = word.replace(".","").toLowerCase();
	// returns normalized values
	if (word == "mr" || word == "master" || word == "mister") {
		return "Mr.";
	} else if (word == "mrs") {
		return "Mrs.";
	} else if (word == "miss" || word == "ms") {
		return "Ms.";
	} else if (word == "dr") {
		return "Dr.";
	} else if (word == "rev") {
		return "Rev.";
	} else if (word == "fr") {
		return "Fr.";
	} else {
		return false;
	}
};

//  detect and format common suffixes 
NameParse.is_suffix = function (word) {
	// ignore periods
	word = word.replace(/\./g,"").toLowerCase();
	// these are some common suffixes - what am I missing?
	var suffixArray = ['I','II','III','IV','V','Senior','Junior','Jr','Sr','PhD','APR','RPh','PE','MD','MA','DMD','CME'];

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
	var words = ['vere','von','van','de','del','della','di','da','pietro','vanden','du','st.','st','la','lo','ter'];
	return words.indexOf(word) >= 0;
};

// single letter, possibly followed by a period
NameParse.is_initial = function (word) {
	// ignore periods
	word = word.replace(".","");
	return (word.length == 1);
};

// detect mixed case words like "McDonald"
// returns false if the string is all one case
// FIXME: No it doesn't. It returns true so long as there is a letter in the string, or if it's empty
// FIXME: Also this does not take in to account the first letter being capitalized
NameParse.is_camel_case = function (word) {
	var ucReg = /|[A-Z]+|s/;
	var lcReg = /|[a-z]+|s/;
	return (word.match(ucReg) != null && word.match(lcReg) != null);
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
		return this.is_camel_case(thisWord) ? thisWord : thisWord.ucfirst();
	}, this).join(seperator);
};
