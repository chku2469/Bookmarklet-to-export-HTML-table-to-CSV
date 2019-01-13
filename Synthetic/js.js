function provideJqueryAndCall(success) {
	if(typeof jQuery != 'undefined') {
		success();
		return;
	}
	var script = document.createElement('script');
	script.src = 'https://code.jquery.com/jquery-latest.min.js';
	var head = document.getElementsByTagName('head')[0];
	var done = false;

	script.onload = script.onreadystatechange = function() {
		if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
			done = true;
			success();
			script.onload = script.onreadystatechange = null;
			head.removeChild(script);
		}
	};
	head.appendChild(script);
}

function downloadCSVFile(filename, mime, text) {
	var pom = document.createElement('a');
	pom.setAttribute('href', 'data:' + mime + ';charset=utf-8,%EF%BB%BF' + encodeURIComponent(text));
	pom.setAttribute('download', filename);
	document.body.appendChild(pom);
	pom.click();
	document.body.removeChild(pom);
}

function addCSVLinks() {
	jQuery('.csvLink').remove();

	jQuery('table').each(function(index){
		jQuery(this).attr('data-csvtable', index).before(
			'<a href=&quot;#&quot; class=&quot;csvLink&quot; data-forcsvtable=&quot;' +
				index + '&quot;>Export to CSV</a>');
	});

	jQuery('.csvLink').click(function(){
		var text = '';
		var csvTableIndex = jQuery(this).attr('data-forcsvtable');
		jQuery('table[data-csvtable=&quot;' + csvTableIndex + '&quot;] tr').each(function(){
			if(jQuery(this).parent(':hidden').length) {
				return;
			}
			jQuery('td, th', this).each(function(index){
				if(index != 0) { text += ';'; }
				text += '\x22';
				text += convertTableCell(this);
				text += '\x22';
			});
			text += '\r\n';
		});
		jQuery('.csvLink').remove();
		downloadCSVFile('Confluence-Table.csv', 'text/csv', text);
	});
}

function getParaText(selector) {
	var result = jQuery(selector).html();
	if(result.indexOf('<br>') < 0) {
		result = jQuery(selector).text();
	} else {
		result = result.
			replace(/<br *\/?>/g, '\r\n'). // replace <br>
			replace(/[\x20\x09]*(\r\n|\n|\r)+[\x20\x09]*/g,
					'\r\n'); // normalise line breaks and surrounding space
	}
	return '\r\n' + result.trim();
}

function convertTableCell(cell) {
	var result = '';
	if(jQuery('div', cell).length) {
		jQuery('div', cell).each(function(){
			result += getParaText(this);
		});
	} else if(jQuery('ul', cell).length) {
		jQuery('ul > li', cell).each(function(){
			result += getParaText(this);
		});
	} else if(jQuery('p', cell).length) {
		jQuery('p', cell).each(function(){
			result += getParaText(this);
		});
	} else {
		result += getParaText(cell);
	}
	return result.
		replace(/\xa0/g, '\x20'). // non-breaking spaces
		replace(/[\x20\x09]+/g, '\x20'). // normalise spaces and tabs
		replace(/\x22/g, '\x22\x22'). // double quotes
		trim();
}

function visualizeWhiteSpace(string) {
	return string.
		replace(/</g, '&lt;'). // show tags
		replace(/>/g, '&gt;'). // and end tags
		replace(/(\r\n|\r|\n)/g, '&#x23ce;<br>'). // line breaks
		replace(/\xa0/g, '&#x2423;'). // non-breaking space
		replace(/\x20/g, '&#xb7;'). // normal space
		replace(/\x9/g, '&#21a6;'); // tab character
}

function convertLeftColumn(table) {
	jQuery('tr > td', table).each(function(index) {
		// insert column to the right
		jQuery(this).after(
			'<td>' + visualizeWhiteSpace(convertTableCell(this)) + '</td>');
	});
}
