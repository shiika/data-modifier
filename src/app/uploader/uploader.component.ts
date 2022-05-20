import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-uploader',
  templateUrl: './uploader.component.html',
  styleUrls: ['./uploader.component.scss'],
})
export class UploaderComponent implements OnInit {
  @ViewChild('imgElement') img: ElementRef;
  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    vendor: ['', Validators.required],
    type: ['', Validators.required],
  });
  pdfFile: any;
  availableFileFormats: string[] = ['png', 'jpg', 'jpeg', 'pdf'];
  isUpload: boolean = false;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  onFileUpload(e: Event): void {
    this.isUpload = true;
    const file = e.target['files'][0];
    const fileSize = file.size;
    const fileName = file.name;
    if (this.imageValidator(fileSize, fileName) === null) {
      this.isUpload = false;
      this.form.setErrors(null);
      this.form.get('name').setValue(fileName);
      const fileForm = new FormData();
      fileForm.append('file', file);
      this.pdfFile = fileForm;
      // const reader = new FileReader();
      // reader.onload = (e) => {
      //   console.log(e);
      // };
      // reader.readAsDataURL(file);
      // this.attachment
      //   .uploadAttachements(e.target['files'])
      //   .pipe(take(1))
      //   .subscribe((res: any) => {
      //     (this.form.get(`Sample ${id}`).get('images') as FormArray).push(
      //       new FormControl(res.data.attachments[0])
      //     );
      //     this.isUpload = false;
      //   });
    } else {
      this.form.setErrors(this.imageValidator(fileSize, fileName));
    }
  }

  imageValidator(size: number, file: string): ValidationErrors | null {
    const fileName = file.split('.');
    const fileType = fileName[fileName.length - 1];
    if (
      this.availableFileFormats.findIndex((type) => type == fileType) === -1
    ) {
      return { value: 'File type is not supported' };
    }

    return null;
  }

  submitForm(): void {
    // api request
    this.isLoading = true;
    this.pdfFile.append('vendor type', 'vendor');
    this.pdfFile.append('type', this.form.value['type']);
    this.api
      .upload(this.pdfFile)
      .pipe(take(1))
      .subscribe(
        (res) => {
          this.isLoading = false;
          this.api.allPoints = res[0];
          this.api.objectives = res[1];
          this.api.images = res[2].map(
            (image: { image: string }) => image.image
          );
          this.api.isActive = true;
          this.router.navigate(['/preview']);
        },
        (err) => {
          this.isLoading = false;
        }
      );
  }
}
